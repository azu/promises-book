# @power-doctest/core

power-doctest core library.

## Features

- Convert Code to power-doctest ready code.
- power-doctest use [comment-to-assert](https://www.npmjs.com/package/comment-to-assert) and [power-assert](https://github.com/twada/power-assert "power-assert")


## Installation

``` sh
npm install @power-doctest/core
```

## Usage

power-doctest convert following code

``` js
function sum(ary) {
    return ary.reduce(function (current, next) {
        return current + next
    }, 0);
}

var total = sum([1, 2, 3, 4, 5]);
total; // => 5
```

to

``` js
var assert = require('power-assert');
function sum(ary) {
    return ary.reduce(function (current, next) {
        return current + next;
    }, 0);
}
var total = sum([
    1,
    2,
    3,
    4,
    5
]);
assert.equal(assert._expr(assert._capt(total, 'arguments/0'), {
    content: 'assert.equal(total, 5)',
    line: 14
}), 5);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IiIsInNvdXJjZXNDb250ZW50IjpbXX0
```

And execute this transformed code:

```sh
$ node example/transformed.js
AssertionError:   # at line: 14

  assert.equal(total, 5)
               |
               15

```

![assert-test](http://gyazo.com/075b4afe13003bd8691a85b371f84afe.gif)

### API

- `convertCode`: Convert code to code
- `convertAST`: Convert Babel's AST to AST

```ts
import { ParserOptions } from "@babel/parser";
import { File } from "@babel/types";
export interface convertCodeOption {
    filePath: string;
    babel?: ParserOptions;
    assertBeforeCallbackName?: string;
    assertAfterCallbackName?: string;
}
/**
 * Convert Code to Code
 * @param code
 * @param options
 */
export declare function convertCode(code: string, options: convertCodeOption): string;
export interface convertASTOptions {
    assertBeforeCallbackName?: string;
    assertAfterCallbackName?: string;
    filePath: string;
}
/**
 * Convert AST to AST
 * @param AST
 * @param options
 */
export declare function convertAST<T extends File>(AST: T, options: convertASTOptions): T;
```

### Exception Test

Look like `=> Error` is `assert.throw()`.

``` js
throw new Error(); // => Error
var object = {};
obj.not.found; // => Error
```

Covert this case to:

```js
var assert = require('power-assert');
assert.throws(function () {
    throw new Error();
}, Error);
var object = {};
assert.throws(function () {
    object.not.found;
}, Error);
```

## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## License

MIT
