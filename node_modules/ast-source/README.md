# ast-source [![Build Status](https://travis-ci.org/azu/ast-source.svg?branch=master)](https://travis-ci.org/azu/ast-source)

AST helper to transform source code.

On purpose make you focus to develop AST transforming function.


## Installation

    npm install ast-source

## Feature

- Automatically select JavaScript parser like esprima or babel(babylon)
    - It make you focus to develop AST transforming function.
- SourceMap support is first class.
- Always get clean AST if you want.
    - AST transforming function pollute AST's meta info(`range`, `loc` etc..).
    - `ASTSource#transformStrict` provide always clean AST by options.

## Example

- [azu/comment-to-assert: convert single line comment to assert.](https://github.com/azu/comment-to-assert)
- [azu/power-doctest: JavaScript: doctest + power-assert.](https://github.com/azu/power-doctest)


## Usage

### API

#### ASTSource(code, options)

ASTSource's input is source code, output is `ASTOutput`.

```js
var source = new ASTSource(code, options)
```

All options are optional. often set `filePath` as options.

```js
/**
 * @namespace
 * @type {Object} ASTSourceOptions
 * @property {string} ASTSourceOptions.filePath? path to source code
 * @property {string} ASTSourceOptions.sourceRoot? source root path to source code
 * @property {parserType} ASTSourceOptions.parserType? what parser is used
 * @property {boolean} ASTSourceOptions.esprimaTokens? tokens
 * @property {boolean} ASTSourceOptions.range? range
 * @property {boolean} ASTSourceOptions.loc? location
 * @property {boolean} ASTSourceOptions.comment?
 */
const defaultOptions = {
    filePath: null,
    disableSourceMap: false,
    parserType: null,
    esprimaTokens: true,
    loc: true,
    range: true,
    comment: true
};
```

##### value(): AST

Returns current AST

##### cloneValue(): AST

Return current AST that is [espurify](https://github.com/estools/espurify "espurify")ed.

##### transform(fn)

Transform current AST by `fn`.

```js
function transformFn(AST){
   return modify(AST)
}
var source = new ASTSource(code, options)
source.transform(transformFn);
```

##### transformStrict(fn)

Transform AST by `fn` after healing the AST.

re-calculate `range`, `loc`, `comment` the AST and transform.

##### output(): ASTOutput

Returns `ASTOutput`

#### ASTOutput

ASTOutput's input is source code, output are source code and source-map.

##### code: string

Returns source code of the results.

##### map: Object

Returns source map of the results.

##### codeWithMap: string

Returns source code that include base64ed comment of source map.

### Example

See [example](./example).
 
Run `npm test` on `example/`

```js
import ASTSource from "ast-source"
import estraverse from "estraverse"
import fs from "fs"

function transform(AST) {
    var replaced = {
        "type": "Literal",
        "value": 42,
        "raw": "42"
    };
    return estraverse.replace(AST, {
        enter: function (node) {
            if (node.type === estraverse.Syntax.Literal) {
                return replaced;
            }
        }
    });
}

var source = new ASTSource(fs.readFileSync("./input.js", "utf-8"), {
    filePath: "./input.js"
});
var output = source.transform(transform).output();
console.log(output.code);// => "var a = 42;"
console.dir(output.map.toString()); // => source map
fs.writeFileSync("./output.js", output.codeWithMap, "utf-8");

```

## Tests

    npm test

## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## License

MIT
