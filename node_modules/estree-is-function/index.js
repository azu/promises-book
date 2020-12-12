module.exports = function isFunction (node) {
  if (typeof node !== 'object' || !node) {
    throw new TypeError('estree-is-function: node must be an object')
  }

  if (typeof node.type !== 'string') {
    throw new TypeError('estree-is-function: node must have a string type')
  }

  return node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression'
}
