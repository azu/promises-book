# @power-doctest/javascript

A JavaScript parser for power-doctest.

## Install

Install with [npm](https://www.npmjs.com/):

    npm install @power-doctest/javascript

## Usage

### Doctest Control Annotation

Write Doctest Control Annotation as comment

#### Enable doctest

Enable doctest for the source code.

```js
// doctest-enabled
```

#### Disable doctest

Disable doctest for the source code.

```js
// doctest-disbaled
```

### Expected Error

If the expected error is not match the result, throw error.

```js
// doctest-error: SyntaxError

++SHOULD BE SyntaxError++
```

#### Options

Pass `options` to [@power-doctest/tester](https://www.npmjs.com/package/@power-doctest/tester)
The inline options is preferred constructor options.
```js
// doctest-options:{ "runMode": "any" }
```

#### Metadata

Write metadata to doctest.

```js
// doctest-meta:{ "key": "value" }
```

## Changelog

See [Releases page](https://github.com/azu/power-doctest/releases).

## Running tests

Install devDependencies and Run `npm test`:

    npm test

## Contributing

Pull requests and stars are always welcome.

For bugs and feature requests, [please create an issue](https://github.com/azu/power-doctest/issues).

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## Author

- [github/azu](https://github.com/azu)
- [twitter/azu_re](https://twitter.com/azu_re)

## License

MIT © azu
