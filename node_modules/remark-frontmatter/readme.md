# remark-frontmatter

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Chat][chat-badge]][chat]
[![Sponsors][sponsors-badge]][collective]
[![Backers][backers-badge]][collective]

Frontmatter (YAML, TOML, and more) support for [**remark**][remark].

## Installation

[npm][]:

```bash
npm install remark-frontmatter
```

## Usage

Say we have the following file, `example.md`:

```markdown
+++
title = "New Website"
+++

# Other markdown
```

And our script, `example.js`, looks as follows:

```javascript
var vfile = require('to-vfile')
var report = require('vfile-reporter')
var unified = require('unified')
var parse = require('remark-parse')
var stringify = require('remark-stringify')
var frontmatter = require('remark-frontmatter')

unified()
  .use(parse)
  .use(stringify)
  .use(frontmatter, ['yaml', 'toml'])
  .use(logger)
  .process(vfile.readSync('example.md'), function(err, file) {
    console.log(String(file))
    console.error(report(err || file))
  })

function logger() {
  return console.dir
}
```

Now, running `node example` yields:

```js
{ type: 'root',
  children:
   [ { type: 'toml',
       value: 'title = "New Website"',
       position: [Object] },
     { type: 'heading',
       depth: 1,
       children: [Array],
       position: [Object] } ],
  position: [Object] }
```

```markdown
example.md: no issues found
+++
title = "New Website"
+++

# Other markdown
```

## API

### `remark.use(frontmatter[, options])`

Adds [tokenizers][] if the [processor][] is configured with
[`remark-parse`][parse], and [visitors][] if configured with
[`remark-stringify`][stringify].

If you are parsing from a different syntax, or compiling to a different syntax
(e.g., [`remark-man`][man]) your custom nodes may not be supported.

##### `options`

One [`preset`][preset] or [`Matter`][matter], or an array of them, defining all
the supported frontmatters (default: `'yaml'`).

##### `preset`

Either `'yaml'` or `'toml'`:

*   `'yaml'` — [`matter`][matter] defined as `{type: 'yaml', marker: '-'}`
*   `'toml'` — [`matter`][matter] defined as `{type: 'toml', marker: '+'}`

##### `Matter`

An object with a `type` and either a `marker` or a `fence`:

*   `type` (`string`) — Node type to parse to in [mdast][] and compile from
*   `marker` (`string` or `{open: string, close: string}`) — Character used
    to construct fences.  By providing an object with `open` and `close`.
    different characters can be used for opening and closing fences.  For
    example the character `'-'` will result in `'---'` being used as the fence
*   `fence` (`string` or `{open: string, close: string}`) — String used as
    the complete fence.  By providing an object with `open` and `close`
    different values can be used for opening and closing fences.  This can be
    used too if fences contain different characters or lengths other than 3
*   `anywhere` (`boolean`, default: `false`) – if `true`, matter can be
    found anywhere in the document.  If `false` (default), only matter at the
    start of the document is recognised.

###### Example

For `{type: 'yaml', marker: '-'}`:

```yaml
---
key: value
---
```

Yields:

```json
{
  "type": "yaml",
  "value": "key: value"
}
```

###### Example

For `{type: 'custom', marker: {open: '<', close: '>'}}`:

```text
<<<
data
>>>
```

Yields:

```json
{
  "type": "custom",
  "value": "data"
}
```

###### Example

For `{type: 'custom', fence: '+=+=+=+'}`:

```text
+=+=+=+
data
+=+=+=+
```

Yields:

```json
{
  "type": "custom",
  "value": "dats"
}
```

###### Example

For `{type: 'json', fence: {open: '{', close: '}'}}`:

```json
{
  "key": "value"
}
```

Yields:

```json
{
  "type": "json",
  "value": "\"key\": \"value\""
}
```

## Related

*   [`remark-github`](https://github.com/remarkjs/remark-github)
    — Auto-link references like in GitHub issues, PRs, and comments
*   [`remark-math`](https://github.com/rokt33r/remark-math)
    — Math support
*   [`remark-yaml-config`](https://github.com/remarkjs/remark-yaml-config)
    — Configure remark from YAML configuration

## Contribute

See [`contributing.md` in `remarkjs/remark`][contributing] for ways to get
started.

This organisation has a [Code of Conduct][coc].  By interacting with this
repository, organisation, or community you agree to abide by its terms.

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definitions -->

[build-badge]: https://img.shields.io/travis/remarkjs/remark-frontmatter.svg

[build]: https://travis-ci.org/remarkjs/remark-frontmatter

[coverage-badge]: https://img.shields.io/codecov/c/github/remarkjs/remark-frontmatter.svg

[coverage]: https://codecov.io/github/remarkjs/remark-frontmatter

[downloads-badge]: https://img.shields.io/npm/dm/remark-frontmatter.svg

[downloads]: https://www.npmjs.com/package/remark-frontmatter

[chat-badge]: https://img.shields.io/badge/join%20the%20community-on%20spectrum-7b16ff.svg

[chat]: https://spectrum.chat/unified/remark

[sponsors-badge]: https://opencollective.com/unified/sponsors/badge.svg

[backers-badge]: https://opencollective.com/unified/backers/badge.svg

[collective]: https://opencollective.com/unified

[license]: license

[author]: https://wooorm.com

[npm]: https://docs.npmjs.com/cli/install

[remark]: https://github.com/remarkjs/remark

[parse]: https://github.com/remarkjs/remark/tree/master/packages/remark-parse

[tokenizers]: https://github.com/remarkjs/remark/tree/master/packages/remark-parse#parserblocktokenizers

[stringify]: https://github.com/remarkjs/remark/tree/master/packages/remark-stringify

[visitors]: https://github.com/remarkjs/remark/tree/master/packages/remark-stringify#compilervisitors

[processor]: https://github.com/unifiedjs/unified#processor

[mdast]: https://github.com/syntax-tree/mdast

[preset]: #preset

[matter]: #matter

[man]: https://github.com/remarkjs/remark-man

[contributing]: https://github.com/remarkjs/remark/blob/master/contributing.md

[coc]: https://github.com/remarkjs/remark/blob/master/code-of-conduct.md
