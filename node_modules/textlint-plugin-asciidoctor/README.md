# textlint-plugin-asciidoctor

[Asciidoctor](http://asciidoctor.org/ "Asciidoctor") support for [textlint](https://github.com/textlint/textlint "textlint")
using [asciidoctor.js](https://github.com/asciidoctor/asciidoctor.js).

[![Travis CI Build Status](https://travis-ci.org/seikichi/textlint-plugin-asciidoctor.svg)](https://travis-ci.org/seikichi/textlint-plugin-asciidoctor) [![npm version](https://badge.fury.io/js/textlint-plugin-asciidoctor.svg)](https://badge.fury.io/js/textlint-plugin-asciidoctor)

## Installation

```sh
> npm install textlint-plugin-asciidoctor
```

## Limitation

- Currently, some syntax (e.g., comment, preamble) are not supported.
  - If you find unsupported syntax, please create an issue.
  - See [test code](test/parse.test.js) for details.

## Usage

```
{
  "plugins": [
    "asciidoctor"
  ]
}
```

## File Extension

This plugin recognize these file extension as asciidoc file. 

- ".asciidoc",
- ".adoc",
- ".asc"

http://asciidoctor.org/docs/asciidoc-recommended-practices/

## Tests

```sh
> npm test
```

## Show TxtAST

```sh
> ./bin/asciidoc-to-textlint-ast.js < input.adoc | jq .
...
```

or

```sh
> npm install textlint-plugin-asciidoctor
> $(npm bin)/asciidoc-to-textlint-ast < input.adoc | jq .
```


## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## Alternatives

- [azu/textlint-plugin-asciidoc-loose](https://github.com/azu/textlint-plugin-asciidoc-loose)

## License

MIT
