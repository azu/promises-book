# @power-doctest/asciidoctor

A [Asciidoctor](https://asciidoctor.org/) parser for power-doctest.

## Install

Install with [npm](https://www.npmjs.com/):

    npm install @power-doctest/asciidoctor

## Usage

## Doctest Control Annotation

`@power-doctest/asciidoctor` support Doctest Control Annotation as attributes.

### Enable Doctest

Enable doctest for the source code.

```asciidoc
[doctest="enabled"]
[source,javascript]
----
const str = "string";
console.log(str); // => "string"
----
```

### Disable Doctest

Disable doctest for the source code.

```asciidoc
[doctest="disabled"]
[source,javascript]
----
const str = "string";
console.log(str); // => "string"
----
```

### Expected error

If the expected error is not match the result, throw error.

```asciidoc
[doctest-error="SyntaxError"]
[source,javascript]
----
+++++INVALID SYNTAX++++
----
```

### Doctest options

Pass `options` to [@power-doctest/tester](https://www.npmjs.com/package/@power-doctest/tester)
The inline options is preferred constructor options.

    <!-- doctest:options:{ "runMode": "any" } -->
    ```js
    if (1 === 1) {
        console.log(1); // => 1
    } else{
        console.log(2); // => 2
    }
    ```

### Metadata

Attach metadata to doctest error of [@power-doctest/tester](https://www.npmjs.com/package/@power-doctest/tester).
It is useful for implementing original behavior.

     
```asciidoc
[doctest-meta={ "ECMAScript": 2017 }]
[source,javascript]
----
const str = "string";
console.log(str); // => "string"
----
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
