# gulp-inlining-node-require [![Build Status](https://travis-ci.org/azu/gulp-inlining-node-require.png?branch=master)](https://travis-ci.org/azu/gulp-inlining-node-require)

> inlining-node-require plugin for [gulp](https://github.com/wearefractal/gulp)

## Usage

First, install `gulp-inlining-node-require` as a development dependency:

```shell
npm install --save-dev gulp-inlining-node-require
```

Then, add it to your `gulpfile.js`:

```javascript
var inlining = require("gulp-inlining-node-require");
gulp.src("./src/*.js")
	.pipe(inlining())
	.pipe(gulp.dest("./dist"));
```

## API

### inlining-node-require(options)

## License

[MIT License](http://en.wikipedia.org/wiki/MIT_License)