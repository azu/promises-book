# comment-to-assert

Convert comment to `assert` function.

```js
const foo = 1;
foo;// => 1
```

Convert this to:

```js
const foo = 1;
assert.strictEqual(foo, 1);
```

## Syntax

This library support following format.

```js
expression; // => expected value
```

or

```js
console.log(expression); // => expected value
```

**Special handling**:

Error:

```js
throw new Error("message"); // Error: "message"
```

Promise:

```js
Promise.resolve(1); // => Resolve: 1
Promise.reject(new Error("message")); // => Reject: message
```


## Installation

    npm install comment-to-assert

### CLI Installation

    npm install -g comment-to-assert
    comment-to-assert target.js > modify.js

## Usage

### toAssertFromSource(source : string, options: toAssertFromSourceOptions): string

Return string that transformed source string of arguments.

```js
import {
    toAssertFromSource,
    toAssertFromAST
} from "comment-to-assert"
toAssertFromSource("1;// => 1");// => "assert.equal(1, 1)"
```

`toAssertFromSource` only support transform source code.
if want to source map, should use `toAssertFromAST` with own parser and generator.

**Options:**

- `babel`: [@babel/core](https://babeljs.io/docs/en/babel-core) option

```
interface toAssertFromSourceOptions {
    babel?: {
        plugins: string[];
    };
}
```

### toAssertFromAST(AST : object, options: toAssertFromASTOptions): object

Return AST object that transformed AST of arguments.

```js
var AST = parse(`var a = [1];
                          a;// => [1]`);
var resultOfAST = toAssertFromAST(AST);
generate(resultOfAST);
/*
var a = [1];
assert.deepEqual(a, [1]);
*/
```


**Options:**

- `assertBeforeCallbackName`: callback name before assertion
- `assertAfterCallbackName`: callback name after assertion

```
export interface toAssertFromASTOptions {
    assertBeforeCallbackName?: string;
    assertAfterCallbackName?: string;
}
```

```js
1; // => 1
"str"; // => "str"
[1, 2, 3]; // => [1,2,3]
Promise.resolve(1); // => Resolve: 1
```

to be

```js
beforeCallback("id:0");
assert.strictEqual(1, 1);
afterCallback("id:0");
// => 1
beforeCallback("id:1");
assert.strictEqual("str", "str");
afterCallback("id:1");
// => "str"
beforeCallback("id:2");
assert.deepStrictEqual([1, 2, 3], [1, 2, 3]);
afterCallback("id:2");
// => [1,2,3]
Promise.resolve(Promise.resolve(1)).then(v => {
  beforeCallback("id:3");
  assert.strictEqual(v, 1);
  afterCallback("id:3");
  return v;
}); // => Resolve: 1
```

### Example

See [example/](example/)

```
"use strict";
var assert = require("assert");
var toAssertFromSource = require("comment-to-assert").toAssertFromSource;
toAssertFromSource("1;// => 1");// => 'assert.equal(1, 1);'
toAssertFromSource("[1];// => [1]");// => 'assert.deepEqual([1], [1]);'
toAssertFromSource("var foo=1;foo;// => 1");// => 'var foo = 1;\nassert.equal(foo, 1);'
```

## Tests

    npm test

Update snapshots if you need.

    npm run updateSnapshot

## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## License

MIT
