# @power-doctest/tester

A Test Runner for A power-doctest.

## Install

Install with [npm](https://www.npmjs.com/):

    npm install @power-doctest/tester

## Usage

```js
import { run } from "@power-doctest/tester"
run(`
console.log(1); // => 1
console.log("string"); // => "string"
console.log([1, 2, 3]); // => [1, 2, 3]
console.log({ key: "value" }); // => { key: "value" }
console.log(NaN); // => NaN
console.log(null); // => null
// Special Case
throw new Error("message"); // => Error: "message"
// Promise
Promise.resolve(1); // => Resolve: 1
Promise.reject(new Error("message")); // => Reject: "message"
`).then(() => {
    console.log("Pass");
}).catch(error => {
    console.log("failed");
})
```

## Options

```ts
export interface PowerDoctestRunnerOptions {
    // pseudo file path for code
    filePath?: string;
    // sandbox context for code
    // context defined global variables
    context?: {
        [index: string]: any
    }
    // sandbox require mock for code
    requireMock?: {
        [index: string]: any
    }
    // If it is true, console.log output to console
    // If you want to mock console, please pass `console` to `context: { console: consoleMock }`
    //
    // Exception:
    // Always suppress console and assertion, because it is converted to assert function
    // ```
    // console.log(1); // => 1
    // ```
    console?: boolean;
    // Timeout millisecond
    // Default: 2000
    timeout?: number
    // Default: all
    // If runMode is all, all assertions are finished and resolve it
    // If runMode is any, anyone assertion is finished and resolve it
    // In Both, anyone is failed and reject it
    runMode?: "any" | "all";
    // Internal Option
    powerDoctestCallbackFunctionName?: string;
}
```

## Changelog

See [Releases page](https://github.com/azu/power-doctest-runner/releases).

## Running tests

Install devDependencies and Run `npm test`:

    npm test

## Contributing

Pull requests and stars are always welcome.

For bugs and feature requests, [please create an issue](https://github.com/azu/power-doctest-runner/issues).

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
