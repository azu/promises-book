# inlining-node-require [![Build Status](https://travis-ci.org/azu/inlining-node-require.png)](https://travis-ci.org/azu/inlining-node-require)

This module inlining Node's `require()`.

It's similar to [browserify](https://github.com/substack/node-browserify/ "browserify"), but more simple and more local domain,
position closer to `concat`.

## Installation

```sh
npm install inlining-node-require
```

### Task

* [azu/gulp-inlining-node-require](https://github.com/azu/gulp-inlining-node-require "azu/gulp-inlining-node-require")


## Usage

``` sh
$ inlining-node-require -h
$ inlining-node-require index.js
```

## Example

See example/


__add.js__

```
function add(x, y) {
    return x + y;
}
module.exports = add;
```

__index.js__

``` js
var add = require("./add");
add(1, 2);
```

Inlining above module.(entry point is `index.js`)

``` sh
$ inlining-node-require index.js
```

__result.js__

```js
function add(x, y) {
    return x + y;
}
add(1, 2);
```

## Contributing

1. Fork it!
2. traCreate your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## License

MIT
