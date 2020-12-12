# diff-match-patch

npm package for https://code.google.com/p/google-diff-match-patch/

[![Build Status](https://travis-ci.org/ForbesLindesay/diff-match-patch.png?branch=master)](https://travis-ci.org/ForbesLindesay/diff-match-patch)
[![Dependency Status](https://gemnasium.com/ForbesLindesay/diff-match-patch.png)](https://gemnasium.com/ForbesLindesay/diff-match-patch)
[![NPM version](https://badge.fury.io/js/diff-match-patch.png)](http://badge.fury.io/js/diff-match-patch)

## Installation

    npm install diff-match-patch

## API

https://code.google.com/p/google-diff-match-patch/wiki/API

```javascript
var DiffMatchPatch = require('diff-match-patch');
var dmp = new DiffMatchPatch();
//use the methods that dmp has
//see: https://code.google.com/p/google-diff-match-patch/wiki/API

//You can also use the following properties:

DiffMatchPatch.DIFF_DELETE = -1;
DiffMatchPatch.DIFF_INSERT = 1;
DiffMatchPatch.DIFF_EQUAL = 0;
```

## License

  http://www.apache.org/licenses/LICENSE-2.0