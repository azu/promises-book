'use strict';

var CallMatcher = require('call-matcher');
var babelParser = require('@babel/parser');
var assign = require('core-js/library/fn/object/assign');
var find = require('core-js/library/fn/array/find');
var some = require('core-js/library/fn/array/some');
var BabelAssertionVisitor = require('./babel-assertion-visitor');
var isSpreadElement = function (node) {
    return node.type === 'SpreadElement';
};

function BabelEspowerVisitor (babel, opts) {
    this.babel = babel;
    this.matchers = opts.patterns.map(function (pattern) {
        var signatureAst = babelParser.parse(pattern);
        var expression = signatureAst.program.body[0].expression;
        return new CallMatcher(expression, opts);
    });
    this.options = opts;
}

BabelEspowerVisitor.prototype.enter = function (nodePath) {
    var currentNode = nodePath.node;
    var file = nodePath.hub.file;
    var assertionVisitor = file.get('espowerAssertionVisitor');
    if (assertionVisitor) {
        if (assertionVisitor.isGeneratedNode(nodePath) || assertionVisitor.toBeSkipped(nodePath)) {
            // skipping this Node
            // MEMO: exit() will not be called when skip() is called
            nodePath.skip();
            return;
        }
        if (!assertionVisitor.isCapturingArgument() && !this.isCalleeOfParentCallExpression(nodePath)) {
            // entering argument
            assertionVisitor.enterArgument(nodePath);
        }
    } else if (nodePath.isCallExpression()) {
        var matcher = find(this.matchers, function (m) { return m.test(currentNode); });
        if (matcher) {
            // skip modifying argument if SpreadElement appears immediately beneath assert
            if (some(currentNode.arguments, isSpreadElement)) {
                nodePath.skip();
                return;
            }
            // entering assertion
            var espowerOptions = assign({
                path: file.opts.filename, // or opts.sourceFileName?
                sourceMap: file.inputMap ? file.inputMap.toObject() : false
            }, this.options);
            assertionVisitor = new BabelAssertionVisitor(this.babel, matcher, espowerOptions);
            assertionVisitor.enter(nodePath);
            file.set('espowerAssertionVisitor', assertionVisitor);
        }
    }
};

BabelEspowerVisitor.prototype.exit = function (nodePath) {
    var currentNode = nodePath.node;
    var resultTree = currentNode;
    var file = nodePath.hub.file;
    var assertionVisitor = file.get('espowerAssertionVisitor');
    if (!assertionVisitor) {
        return;
    }
    if (assertionVisitor.isLeavingAssertion(nodePath)) {
        // leaving assertion
        assertionVisitor.leave(nodePath);
        file.set('espowerAssertionVisitor', null);
        return;
    }
    if (!assertionVisitor.isCapturingArgument()) {
        return;
    }
    if (assertionVisitor.toBeCaptured(nodePath)) {
        // capturing Node
        resultTree = assertionVisitor.captureNode(nodePath);
    }
    if (assertionVisitor.isLeavingArgument(nodePath)) {
        // capturing whole argument on leaving argument
        resultTree = assertionVisitor.leaveArgument(resultTree);
    }
    if (resultTree !== currentNode) {
        nodePath.replaceWith(resultTree);
    }
};

BabelEspowerVisitor.prototype.isCalleeOfParentCallExpression = function (nodePath) {
    var currentKey = nodePath.key;
    var parentNode = nodePath.parent;
    var types = this.babel.types;
    return types.isCallExpression(parentNode) && currentKey === 'callee';
};

module.exports = BabelEspowerVisitor;
