# scope-analyzer

simple scope analysis for javascript ASTs. tracks scopes and collects references to variables.

Caveats and/or todos:

 - May be missing edge cases.
 - Things like `label:`s are not considered at all, but ideally in the future they will!

[![stability][stability-image]][stability-url]
[![npm][npm-image]][npm-url]
[![travis][travis-image]][travis-url]
[![standard][standard-image]][standard-url]

[stability-image]: https://img.shields.io/badge/stability-experimental-orange.svg?style=flat-square
[stability-url]: https://nodejs.org/api/documentation.html#documentation_stability_index
[npm-image]: https://img.shields.io/npm/v/scope-analyzer.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/scope-analyzer
[travis-image]: https://img.shields.io/travis/goto-bus-stop/scope-analyzer.svg?style=flat-square
[travis-url]: https://travis-ci.org/goto-bus-stop/scope-analyzer
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: http://npm.im/standard

## Install

```
npm install scope-analyzer
```

## Usage

Note: AST nodes passed to `scope-analyzer` functions are expected to reference the parent node on a `node.parent` property.
Nodes from [falafel](https://github.com/substack/node-falafel) or [transform-ast](https://github.com/goto-bus-stop/transform-ast) have a `.parent` property, but others may not. You can use [estree-assign-parent](https://github.com/goto-bus-stop/estree-assign-parent) to quickly assign a parent property to all nodes in an AST.

```js
var scan = require('scope-analyzer')

var ast = parse('...')
// Initialize node module variables
scan.createScope(ast, ['module', 'exports', '__dirname', '__filename'])
scan.analyze(ast)

var binding = scan.getBinding(ast, 'exports')
binding.getReferences().forEach(function (reference) {
  // Assume for the sake of the example that all references to `exports` are assignments like
  // `exports.xyz = abc`
  console.log('found export:', reference.parent.property.name)
})
```

## API

### `crawl(ast)`

Walk the ast and analyze all scopes. This will immediately allow you to use the `get*` methods on any node in the tree.

### `visitScope(node)`

Visit a node to check if it initialises any scopes.
For example, a function declaration will initialise a new scope to hold bindings for its parameters.
Use this if you are already walking the AST manually, and if you don't need the scope information during this walk.

### `visitBinding(node)`

Visit a node to check if it is a reference to an existing binding.
If it is, the reference is added to the parent scope.
Use this if you are already walking the AST manually.

### `createScope(node, bindings)`

Initialise a new scope at the given node. `bindings` is an array of variable names.
This can be useful to make the scope analyzer aware of preexisting global variables.
In that case, call `createScope` on the root node with the names of globals:

```js
var ast = parse('xyz')
scopeAnalyzer.createScope(ast, ['HTMLElement', 'Notification', ...])
```

### `scope(node)`

Get the [Scope](#scope) initialised by the given node.

### `getBinding(node)`

Get the [Binding](#binding) referenced by the `Identifier` `node`.

### Scope

#### `scope.has(name)`

Check if this scope defines `name`.

#### `scope.getBinding(name)`

Get the [Binding](#binding) named `name` that is declared by this scope.

#### `scope.getReferences(name)`

Get a list of all nodes referencing the `name` binding that is declared by this scope.

#### `scope.getUndeclaredNames()`

Get a list of all names that were used in this scope, but not defined anywhere in the AST.

#### `scope.forEach(cb(binding, name))`

Loop over all bindings declared by this scope.

#### `scope.forEachAvailable(cb(binding, name))`

Loop over all bindings available to this scope, declared in this scope or any parent scope.

### Binding

#### `binding.definition`

The node that defined this binding. If this binding was not declared in the AST, `binding.definition` will be undefined.

#### `binding.getReferences()`

Return an array of nodes that reference this binding.

#### `binding.isReferenced()`

Check if the binding is referenced, i.e., if there are any identifier Nodes (other than `binding.definition`) referencing this binding.

#### `binding.remove(node)`

Remove a reference to this binding. Use this when you are replacing the node referencing the binding with something else.

## License

[Apache-2.0](LICENSE.md)
