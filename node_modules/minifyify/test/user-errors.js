/**
* This checks for incorrect usage of minifyify
* since we have a shitty API, might as well fail
* as gracefully as possible.
*/

var domain = require('domain')
  , assert = require('assert')
  , browserify = require('browserify')
  , minifyify = require('../lib/minifier')
  , fixtures = require('./fixtures')
  , tests = {};

tests['browserify is not in debug mode'] = function (next) {
  var d = domain.create();

  d.on('error', function (e) {
    assert.equal(e.toString()
      , 'Error: Browserify must be in debug mode for minifyify to consume sourcemaps'
      , 'Should be a helpful error message, got:\n' + e.toString());
    next();
  });

  d.run(function () {
    var bundle
      , minifier
      , noop;

    noop = function noop () {
      next(new Error('This should never happen'));
    };

    bundle = new browserify();
    minifier = new minifyify();

    bundle.add(fixtures.entryScript('simple file'));

    bundle = bundle
              .transform(require('hbsfy'))
              .transform({global: true}, minifier.transformer)
              .bundle()

    bundle.pipe(minifier.consumer(noop));
  });
}

module.exports = tests;
