transform-filter
================

  Filter [browserify](https://github.com/substack/node-browserify) transforms using glob patterns.

install
-------

```
npm install transform-filter
```

usage
-----

  suspend your disbelief for a second and pretend that [coffeeify](https://github.com/substack/coffeeify) didn't filter the files itself:

```javascript
var filterCoffee = filterTransform( coffeeify, {
  include: ['**/*.coffee'],  // only run transform on matching files
  exclude: ['**/subdir/**'], // because you don't want coffee files in `subdir` processed for some reason.
  base: '/'                  // glob patterns matched relative to this `base` (defaults to process.cwd())
});
```

  * `include` defaults to matching everything (i.e. everything is included).
  * `exclude` defaults to matching nothing (i.e. nothing is excluded).
  * You can use a `!` as the first character of any pattern to negate it

     `exclude:['tests/**','!tests/utils.js']` excludes everything in the tests directory except `utils.js`

  * Patterns can be a string, array of strings, null or undefined.
  * `base` option is computed relative to `process.cwd()`. `base:'..'` would match from the parent directory.
  Use a leading `/` for absolute urls.
  * Exclude takes precedent over include.


If you need more control than glob patterns offer, check out [filter-transform](https://www.npmjs.com/package/filter-transform).

It offers similar filtering via a user supplied callback, and sparked the idea behind this module.


licence
-------

  MIT. &copy; James Talmage