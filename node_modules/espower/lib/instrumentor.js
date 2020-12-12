'use strict';

var estraverse = require('estraverse');
var syntax = estraverse.Syntax;
var escope = require('escope');
var escallmatch = require('escallmatch');
var AssertionVisitor = require('./assertion-visitor');
var Transformation = require('./transformation');
var EspowerError = require('./espower-error');
var typeName = require('type-name');
var find = require('array-find');
var extend = require('xtend');


function Instrumentor (options) {
    verifyOptionPrerequisites(options);
    this.options = options;
    this.matchers = options.patterns.map(function (pattern) { return escallmatch(pattern, options); });
}

Instrumentor.prototype.instrument = function (ast) {
    return estraverse.replace(ast, this.createVisitor(ast));
};

Instrumentor.prototype.createVisitor = function (ast) {
    verifyAstPrerequisites(ast, this.options);
    var that = this;
    var assertionVisitor;
    var storage = {};
    var skipping = false;
    var scopeManager = escope.analyze(ast);
    var globalScope = scopeManager.acquire(ast);
    var scopeStack = [];
    scopeStack.push(globalScope);
    var transformation = new Transformation();
    var visitor = {
        enter: function (currentNode, parentNode) {
            if (/Function/.test(currentNode.type)) {
                scopeStack.push(scopeManager.acquire(currentNode));
            }
            var controller = this;
            var path = controller.path();
            var currentKey = path ? path[path.length - 1] : null;
            if (assertionVisitor) {
                if (assertionVisitor.toBeSkipped(controller)) {
                    skipping = true;
                    return controller.skip();
                }
                if (!assertionVisitor.isCapturingArgument() && !isCalleeOfParentCallExpression(parentNode, currentKey)) {
                    return assertionVisitor.enterArgument(controller);
                }
            } else if (currentNode.type === syntax.CallExpression) {
                var matcher = find(that.matchers, function (matcher) { return matcher.test(currentNode); });
                if (matcher) {
                    // entering target assertion
                    assertionVisitor = new AssertionVisitor(matcher, extend({
                        storage: storage,
                        transformation: transformation,
                        globalScope: globalScope,
                        scopeManager: scopeManager,
                        currentScope: scopeStack[scopeStack.length - 1]
                    }, that.options));
                    assertionVisitor.enter(controller);
                    return undefined;
                }
            }
            return undefined;
        },
        leave: function (currentNode, parentNode) {
            try {
                var controller = this;
                var resultTree = currentNode;
                var path = controller.path();
                var espath = path ? path.join('/') : '';
                if (transformation.isTarget(espath)) {
                    transformation.apply(espath, resultTree);
                    return resultTree;
                }
                if (!assertionVisitor) {
                    return undefined;
                }
                if (skipping) {
                    skipping = false;
                    return undefined;
                }
                if (assertionVisitor.isLeavingAssertion(controller)) {
                    assertionVisitor.leave(controller);
                    assertionVisitor = null;
                    return undefined;
                }
                if (!assertionVisitor.isCapturingArgument()) {
                    return undefined;
                }
                if (assertionVisitor.toBeCaptured(controller)) {
                    resultTree = assertionVisitor.captureNode(controller);
                }
                if (assertionVisitor.isLeavingArgument(controller)) {
                    return assertionVisitor.leaveArgument(resultTree);
                }
                return resultTree;
            } finally {
                if (/Function/.test(currentNode.type)) {
                    scopeStack.pop();
                }
            }
        }
    };
    if (this.options.visitorKeys) {
        visitor.keys = this.options.visitorKeys;
    }
    return visitor;
};

function isCalleeOfParentCallExpression (parentNode, currentKey) {
    return parentNode.type === syntax.CallExpression && currentKey === 'callee';
}

function verifyAstPrerequisites (ast, options) {
    var errorMessage;
    if (typeof ast.loc === 'undefined') {
        errorMessage = 'ECMAScript AST should contain location information.';
        if (options.path) {
            errorMessage += ' path: ' + options.path;
        }
        throw new EspowerError(errorMessage, verifyAstPrerequisites);
    }
}

function verifyOptionPrerequisites (options) {
    if (options.destructive === false) {
        throw new EspowerError('options.destructive is deprecated and always treated as destructive:true', verifyOptionPrerequisites);
    }
    if (typeName(options.patterns) !== 'Array') {
        throw new EspowerError('options.patterns should be an array.', verifyOptionPrerequisites);
    }
}

module.exports = Instrumentor;
