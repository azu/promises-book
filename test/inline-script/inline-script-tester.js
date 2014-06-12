"use strict";
var Q = require("q");
var FS = require("q-io/fs");
var esprima = require("esprima-fb");
var pather = require("path");
// http://www.regexr.com/38t47
var inlineCodeReg = /\[source.*?javascript\]\n[\s\S]*?----([\s\S]*?)----/gm;
var includeCodeReg = /include::/;
function trimIncludeCode(code) {
    var replaceRegExp = /include::.*/g;
    var trimedCode = code.replace(replaceRegExp, "");
    return trimedCode.trim();
}
function pickupContent(content) {
    var results = [];
    var matches;
    while ((matches = inlineCodeReg.exec(content)) !== null) {
        var code = matches[1];
        if (includeCodeReg.test(code)) {
            var trimedCode = trimIncludeCode(code);
            if (trimedCode.length > 0) {
                results.push(trimedCode);
            }
        } else {
            results.push(code);
        }
    }
    return results;
}
function parseContents(content, filePath) {
    try {
        esprima.parse(content);
    } catch (error) {
        error.filePath = filePath;
        error.fileContent = content;
        return error;
    }
}

function printResults(results) {
    results.forEach(function (errors) {
        errors.forEach(function (error) {
            console.error(">> filePath : " + pather.resolve(error.filePath) + "\n"
                    + "----\n" + error.fileContent.trim() + "\n----\n",
                error,
                "\n\n"
            );
        });
    });
}

module.exports.checkInlineScript = function checkInlineScript(rootPath) {
    var asciidocPromises = FS.listTree(rootPath, function isAsciiDoc(filePath, stat) {
        if (stat.isDirectory()) {
            return false;
        }
        return pather.extname(filePath) === ".adoc";
    });

    return asciidocPromises.then(function (filePathList) {
        var promises = filePathList.map(function (filePath) {
            return FS.read(filePath)
                .then(pickupContent)
                .then(function (contents) {
                    return contents.map(function (content) {
                        return parseContents(content, filePath);
                    }).filter(function hasError(error) {
                        return error != null && error instanceof Error;
                    });
                });
        });
        return Q.all(promises).then(function (results) {
            var filteredResults = results.filter(function (errors) {
                return Array.isArray(errors) && errors.length > 0;
            });

            if (filteredResults.length > 0) {
                printResults(filteredResults);
                return Q.reject("Found parse error count :" + filteredResults.length);
            }
        });
    });
};