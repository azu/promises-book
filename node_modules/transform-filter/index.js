'use strict';
var multimatch = require('multimatch');
var through = require('through');
var path = require('path') ;


module.exports = transformFilter;

function transformFilter (transform, opts){
  var includePattern, excludePattern;

  // support original api.
  if (typeof transform !== 'function') {
    includePattern = transform;
    excludePattern = opts;
    opts = null;
    transform = arguments[2];
    if (typeof excludePattern === 'function') {
      transform = excludePattern;
      excludePattern = null;
    }
  } else {
    includePattern = opts && opts.include;
    excludePattern = opts && opts.exclude;
  }

  var base = path.resolve(opts && opts.base || '.');

  function include (path) {
    return includePattern ? !!multimatch(path, includePattern).length : true;
  }

  function exclude (path) {
    return excludePattern ? !!multimatch(path, excludePattern).length : false;
  }

  function test (file) {
    var p = path.relative(base, file);
    return !exclude(p) && include(p);
  }

  return function (file, opts) {
    var pass = test(file);
    return pass ? transform.call(this,file, opts) : through();
  };
}
