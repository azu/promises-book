var test = require('tape')
var parse = require('acorn').parse
var ArrayFrom = require('array-from')
var scan = require('../')

function crawl (src, opts) {
  var ast = parse(src, opts)
  scan.crawl(ast)
  return ast
}

test('register variable declarations in scope', function (t) {
  t.plan(5)
  var ast = crawl('var a, b; const c = 0; let d')

  var scope = scan.scope(ast)
  t.ok(scope.has('a'), 'should find var')
  t.ok(scope.has('b'), 'should find second declarator in var statement')
  t.ok(scope.has('c'), 'should find const')
  t.ok(scope.has('d'), 'should find let')
  t.notOk(scope.has('e'), 'nonexistent names should return false')
})

test('register variable declarations in block scope', function (t) {
  t.plan(4)
  var ast = crawl('var a, b; { let b; }')
  var scope = scan.scope(ast)
  t.ok(scope.has('a'))
  t.ok(scope.has('b'))
  scope = scan.scope(ast.body[1])
  t.ok(scope.has('b'), 'should declare `let` variable in BlockStatement scope')
  t.notOk(scope.has('a'), 'should only return true for names declared here')
})

test('register non variable declarations (function, class, parameter)', function (t) {
  t.plan(4)
  var ast = crawl('function a (b, a) {} class X {}')
  var scope = scan.scope(ast)
  t.ok(scope.has('a'), 'should find function declarations')
  t.ok(scope.has('X'), 'should find class definition')
  scope = scan.scope(ast.body[0]) // function declaration
  t.ok(scope.has('a'), 'should find shadowed parameter')
  t.ok(scope.has('b'), 'should find parameter')
})

test('shadowing', function (t) {
  t.plan(8)
  var ast = crawl(`
    var a
    { let a }
    function b (b) {
      var a
    }
  `)
  var root = scan.scope(ast)
  var block = scan.scope(ast.body[1])
  var fn = scan.scope(ast.body[2])
  t.ok(root.has('a'), 'should find global var')
  t.ok(root.has('b'), 'should find function declaration')
  t.ok(block.has('a'), 'should shadow vars using `let` in block scope')
  t.notEqual(block.getBinding('a'), root.getBinding('a'), 'shadowing should define different bindings')
  t.ok(fn.has('b'), 'should find function parameter')
  t.notEqual(fn.getBinding('b'), root.getBinding('b'), 'shadowing function name with parameter should define different bindings')
  t.ok(fn.has('a'), 'should find local var')
  t.notEqual(fn.getBinding('a'), root.getBinding('a'), 'shadowing vars in function scope should define different bindings')
})

test('references', function (t) {
  t.plan(5)

  var src = `
    var a = 0
    a++
    a++
    function b (b) {
      console.log(b(a))
    }
    b(function (b) { return a + b })
  `
  var ast = crawl(src)

  var root = scan.scope(ast)
  var fn = scan.scope(ast.body[3])
  var callback = scan.scope(ast.body[4].expression.arguments[0])

  var a = root.getBinding('a')
  t.equal(a.getReferences().length, 5, 'should collect references in same and nested scopes')
  var b = root.getBinding('b')
  t.equal(b.getReferences().length, 2, 'should collect references to function declaration')
  var b2 = fn.getBinding('b')
  t.equal(b2.getReferences().length, 2, 'should collect references to shadowed function parameter')
  var b3 = callback.getBinding('b')
  t.equal(b3.getReferences().length, 2, 'should collect references to shadowed function parameter')

  // try to rewrite some things
  var result = src.split('')
  a.getReferences().forEach(function (ref) { result[ref.start] = 'x' })
  b.getReferences().forEach(function (ref) { result[ref.start] = 'y' })
  b2.getReferences().forEach(function (ref) { result[ref.start] = 'z' })
  b3.getReferences().forEach(function (ref) { result[ref.start] = 'w' })
  t.equal(result.join(''), `
    var x = 0
    x++
    x++
    function y (z) {
      console.log(z(x))
    }
    y(function (w) { return x + w })
  `, 'references were associated correctly')
})

test('references that are declared later', function (t) {
  t.plan(4)

  var src = `
    if (true) { b(function () { c() }) }
    function b () {}
    function c () {}
  `
  var ast = crawl(src)

  var scope = scan.scope(ast)
  var b = scope.getBinding('b')
  t.ok(b, 'should have a binding for function b(){}')
  var c = scope.getBinding('c')
  t.ok(c, 'should have a binding for function c(){}')
  t.equal(b.getReferences().length, 2, 'should find all references for b')
  t.equal(c.getReferences().length, 2, 'should find all references for c')
})

test('do not count object keys and method definitions as references', function (t) {
  t.plan(2)

  var src = `
    var a
    class B { a () {} }
    class C { get a () {} }
    class D { set a (b) {} }
    var e = { a: null }
  `
  var ast = crawl(src)

  var scope = scan.scope(ast)
  var a = scope.getBinding('a')
  t.equal(a.getReferences().length, 1)
  t.deepEqual(a.getReferences(), [a.definition])
})

test('do not count renamed imported identifiers as references', function (t) {
  t.plan(2)

  var src = `
    var a = 0
    a++
    a++
    import { a as b } from "b"
    b()
  `
  var ast = crawl(src, { sourceType: 'module' })

  var root = scan.scope(ast)

  var a = root.getBinding('a')
  var b = root.getBinding('b')
  t.equal(a.getReferences().length, 3, 'should not have counted renamed `a` import as a reference')
  t.equal(b.getReferences().length, 2, 'should have counted local name of renamed import')
})

test('remove references', function (t) {
  t.plan(6)

  var src = `
    function a () {}
    a()
    a()
  `
  var ast = crawl(src)

  var root = scan.scope(ast)
  var a = root.getBinding('a')
  t.equal(a.getReferences().length, 3, 'should have 3 references')
  t.ok(a.isReferenced(), 'should be referenced')
  var reference = ast.body[1].expression.callee
  a.remove(reference)
  t.equal(a.getReferences().length, 2, 'should have removed the reference')
  t.ok(a.isReferenced(), 'should still be referenced')
  reference = ast.body[2].expression.callee
  a.remove(reference)
  t.equal(a.getReferences().length, 1, 'should still have the definition reference')
  t.notOk(a.isReferenced(), 'should no longer be referenced')
})

test('collect references to undeclared variables', function (t) {
  t.plan(2)

  var src = `
    var a = b
    b = a
    a(b)
    function c () {
      return d
    }
  `
  var ast = crawl(src)

  var root = scan.scope(ast)
  var undeclared = ArrayFrom(root.undeclaredBindings.keys())
  var declared = ArrayFrom(root.bindings.keys())
  t.deepEqual(undeclared, ['b', 'd'])
  t.deepEqual(declared, ['a', 'c'])
})

test('loop over all available bindings, including declared in parent scope', function (t) {
  t.plan(1)

  var src = `
    var a = 0
    var b = 1, c = 2
    function d() {
      function e() {}
      function f() {
        var b = 3
        console.log('bindings')
      }
    }
  `

  var ast = crawl(src)
  var scope = scan.scope(ast.body[2].body.body[1])
  var names = []
  scope.forEachAvailable(function (binding, name) {
    names.push(name)
  })
  t.deepEqual(names, ['b', 'e', 'f', 'a', 'c', 'd'])
})

test('always initialise a scope for the root', function (t) {
  t.plan(2)

  var src = `
    console.log("null")
  `

  var ast = crawl(src)
  var scope = scan.scope(ast)

  t.ok(scope)
  t.deepEqual(scope.getUndeclaredNames(), ['console'])
})

test('initialises a scope for catch clauses', function (t) {
  t.plan(5)
  var ast = crawl(`
    var a = null
    a = 1
    try {
    } catch (a) {
      a = 2
    }
  `)

  var scope = scan.scope(ast)
  t.ok(scope.has('a'), 'should find var')
  t.equal(scope.getBinding('a').getReferences().length, 2, 'only counts references to outer `a`')
  var clause = ast.body[2].handler
  var catchScope = scan.scope(clause)
  t.ok(catchScope.has('a'), 'should find param')
  t.notEqual(scope.getBinding('a'), catchScope.getBinding('a'), 'introduced a different binding')
  t.equal(catchScope.getBinding('a').getReferences().length, 2, 'only counts references to inner `a`')
})
