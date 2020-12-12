# estree-is-function

check if an AST node is a function of some sort.

[![npm][npm-image]][npm-url]
[![travis][travis-image]][travis-url]
[![standard][standard-image]][standard-url]

[npm-image]: https://img.shields.io/npm/v/estree-is-function.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/estree-is-function
[travis-image]: https://img.shields.io/travis/goto-bus-stop/estree-is-function.svg?style=flat-square
[travis-url]: https://travis-ci.org/goto-bus-stop/estree-is-function
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: http://npm.im/standard

## Install

```
npm install estree-is-function
```

## Usage

```js
var isFunction = require('estree-is-function')
isFunction(parse('function a () {}')) // true
isFunction(parse('(function () {})')) // true
isFunction(parse('(() => {})')) // true
isFunction(parse('var x')) // false
```

## License

[Apache-2.0](LICENSE.md)
