var test = require('tape')
var isFunction = require('./')
var parse = require('acorn').parse

test('throws if not a node', function (t) {
  t.plan(2)
  t.throws(function () { isFunction(null) })
  t.throws(function () { isFunction({ whatever: 'xyz' }) })
})

test('FunctionDeclaration', function (t) {
  t.plan(1)
  t.ok(isFunction(parse('function a () {}').body[0]))
})

test('ArrowFunction', function (t) {
  t.plan(1)
  t.ok(isFunction(parse('(() => {})').body[0].expression))
})

test('FunctionExpression', function (t) {
  t.plan(2)
  t.ok(isFunction(parse('(function () {})').body[0].expression))
  t.ok(isFunction(parse('(function a () {})').body[0].expression))
})

test('anything else', function (t) {
  t.plan(3)
  t.notOk(isFunction(parse('10').body[0]))
  t.notOk(isFunction(parse('class A {}').body[0]))
  t.notOk(isFunction(parse('var x = () => {}').body[0]))
})
