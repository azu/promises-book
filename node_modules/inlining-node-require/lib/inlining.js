/**
 * Created by azu on 2014/03/09.
 * LICENSE : MIT
 */
"use strict";
var falafel = require("falafel");
var fs = require("fs");
var _ = require("lodash");
var pather = require("path");
function createHelper(src) {
    return {
        // var add = require("./add")
        isVarAssignedRequire: function (node) {
            if (node.type !== "VariableDeclaration") {
                return false;
            }
            // var add = require("./add")
            var firstDeclaration = node.declarations[0];
            if(firstDeclaration.init == null) {
                return false;
            }
            if (firstDeclaration.init.type === "CallExpression" &&
                firstDeclaration.init.callee.name === "require") {
                return true;
            }
            // var add = require("./add").add
            if (firstDeclaration.init.type === "MemberExpression" &&
                firstDeclaration.init.object.type === "CallExpression" &&
                firstDeclaration.init.object.callee.name === "require") {
                return true;
            }
        },
        getVarIdentifierName: function (node) {
            var firstDeclaration = node.declarations[0];
            return firstDeclaration.id.name;
        },
        getVarRequireModulePath: function (node) {
            var firstDeclaration = node.declarations[0];
            var init = firstDeclaration.init.object || firstDeclaration.init;
            return init["arguments"][0].value;
        },
        isModuleExport: function (node) {
            if (!(node.type === "ExpressionStatement" && node.expression.type === "AssignmentExpression")) {
                return false;
            }
            var left = node.expression.left;
            if (left.type !== "MemberExpression") {
                return false;
            }

            // export.module = fn;
            if (left.object.name === "module" && left.property.name === "exports") {
                return true;
            }
            // export.module.fn = fn
            return left.object.type === "MemberExpression" &&
                left.object.object.name === "module" && left.object.property.name === "exports";

        },
        getModuleRightIdentifier: function (node) {
            var right = node.expression.right;
            if (right.type !== "Identifier") {
                return null;
            }
            return right.name;
        }
    }
}

var defaultOptions = {
    basedir: null
};
var supportedExts = [".js", ".json", ""];
function getReadablePath(filePath, exts) {
    for (var i=0; i < exts.length; i++) {
        var pathWithExt = filePath + exts[i];
        if (fs.existsSync(pathWithExt)) {
            return pathWithExt;
        }
    }
    throw new Error (filePath + " not found.");
}
function isJSON(src) {
    try {
        JSON.parse(src);
        return true;
    } catch (e) {
        return false;
    }
}
function inliningModule(filePath, entryData, opt) {
    var identifierName = entryData.identifierName;
    var basedir = pather.dirname(filePath) || process.cwd();
    var readablePath = getReadablePath(filePath, supportedExts);
    var src = fs.readFileSync(readablePath, "utf-8");
    if (isJSON(src)) {
        var trimedSrc = src.trim();
        return {
            src: trimedSrc,
            isJSON: true
        };
    }
    var helper = createHelper(src);
    var exportName;
    var output = falafel(src, function (node) {
        if (helper.isVarAssignedRequire(node)) {
            var requiredFilePath = helper.getVarRequireModulePath(node) + ".js";
            var resolvedFilePath = pather.resolve(basedir, requiredFilePath);
            var resultObject = inliningModule(resolvedFilePath, {
                // pass var name
                identifierName: helper.getVarIdentifierName(node)
            }, opt);
            if (!resultObject.exportName) {
                // Identifier is Same
                node.update(resultObject.src);
            } else {
                // Identifier is Difference
                var init = node.declarations[0].init;
                init.update(resultObject.src);
            }
        }
        if (helper.isModuleExport(node)) {
            var moduleRightIdentifier = helper.getModuleRightIdentifier(node);
            if (moduleRightIdentifier !== identifierName) {
                var isFunctionDeclaration = function (name) {
                    return function (ele) {
                        return ele.type === "FunctionDeclaration" && ele.id.name === name;
                    }
                };
                var isMatched = node.parent.body.some(isFunctionDeclaration(moduleRightIdentifier));
                if (isMatched) {
                    exportName = moduleRightIdentifier;
                }
            }

            node.update("");
        }
    });
    return {
        src: String(output).trim(),
        exportName: exportName
    };
}
function inlining(filePath, opt) {
    var options = _.merge(defaultOptions, opt);
    var basedir = options.basedir || pather.dirname(filePath) || process.cwd();
    var src = fs.readFileSync(filePath, "utf-8");
    var helper = createHelper(src);
    var output = falafel(src, function (node) {
        if (helper.isVarAssignedRequire(node)) {
            var modulePath = helper.getVarRequireModulePath(node);
            // TODO: fix ignore npm module
            if (!/.\//.test(modulePath)) {
                return;
            }
            var resolvedFilePath = pather.resolve(basedir, modulePath);
            var resultObject = inliningModule(resolvedFilePath, {
                // pass var name
                identifierName: helper.getVarIdentifierName(node)
            }, options);
            if (!resultObject.exportName && !resultObject.isJSON) {
                // Identifier is Same
                node.update(resultObject.src);
            } else {
                // Identifier is Difference
                var init = node.declarations[0].init;
                init.update(resultObject.src);
            }
        }
        if (helper.isModuleExport(node)) {
            var moduleRightIdentifier = helper.getModuleRightIdentifier(node);
            if (moduleRightIdentifier) {
                node.update("");
            }
        }
    });
    return String(output);
}
module.exports = inlining;