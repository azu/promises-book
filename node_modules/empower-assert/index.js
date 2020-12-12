'use strict';

var estraverse = require('estraverse');
var Syntax = estraverse.Syntax;

/**
 * Change `assert` to `power-assert` destructively.
 *
 * @param {Object} ast
 * @return {Object}
 */
function empowerAssert(ast) {
  estraverse.traverse(ast, {
    enter: enter
  });
  return ast;
}

/**
 * @param {Object} node
 * @param {Object} parent
 */
function enter(node, parent) {
  if (node.type === Syntax.AssignmentExpression) {
    if (node.operator !== '=') {
      return;
    }
    if (!isIdentifier(node.left, 'assert')) {
      return;
    }
    if (!isRequireAssert(node.right)) {
      return;
    }
    changeAssertToPowerAssert(node.right.arguments[0]);
  }

  if (node.type === Syntax.VariableDeclarator) {
    if (!isIdentifier(node.id, 'assert')) {
      return;
    }
    if (!isRequireAssert(node.init)) {
      return;
    }
    changeAssertToPowerAssert(node.init.arguments[0]);
  }

  if (node.type === Syntax.ImportDeclaration) {
    var source = node.source;
    if (!source || source.type !== Syntax.Literal || source.value !== 'assert') {
      return;
    }
    var firstSpecifier = node.specifiers[0];
    if (!firstSpecifier || firstSpecifier.type !== Syntax.ImportDefaultSpecifier) {
      return;
    }
    if (!isIdentifier(firstSpecifier.local, 'assert')) {
      return;
    }
    changeAssertToPowerAssert(source);
  }
}

/**
 * @param {Object} node A Literal node.
 */
function changeAssertToPowerAssert(node) {
  node.value = 'power-assert';
}

/**
 * @param {Object} node A CallExpression node.
 * @return {boolean} true if the node is `require('assert')`.
 */
function isRequireAssert(node) {
  if (!node || node.type !== Syntax.CallExpression) {
    return false;
  }
  if (!isIdentifier(node.callee, 'require')) {
    return false;
  }
  var arg = node.arguments[0];
  if (!arg || arg.type !== Syntax.Literal || arg.value !== 'assert') {
    return false;
  }
  return true;
}

/**
 * @param {Object} node
 * @param {string} name
 * @return {boolean}
 */
function isIdentifier(node, name) {
  return node &&
    node.type === Syntax.Identifier &&
    node.name === name;
}

module.exports = empowerAssert;
empowerAssert.enter = enter;
