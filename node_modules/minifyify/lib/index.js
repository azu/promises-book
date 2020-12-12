var plugin
  , fs = require('fs')
  , ReadableStream = require('stream').Readable
  , util = require('util')
  , mkdirp = require('mkdirp')
  , path = require('path');

function MinifiedStream (opts) {
  this._minOptsRef = opts
  ReadableStream.call(this, opts);
}

util.inherits(MinifiedStream, ReadableStream)

MinifiedStream.prototype._read = function noop () {}

plugin = function (bundle, minifyifyOpts) {
  minifyifyOpts = minifyifyOpts || {};

  var minifyify = require('./minifier')
    , minifier = new minifyify(minifyifyOpts)
    , oldBundle = bundle.bundle
    , bundleStarted = false;

  // Hook up the transform so we know what sources were used
  bundle.transform({global: true}, minifier.transformer);

  // Proxy the bundle's bundle function so we can capture its output
  bundle.bundle = function (bundleOpts, bundleCb) {
    var bundleStream
      , minifiedStream = new MinifiedStream();

    // Normalize options
    if(typeof bundleOpts == 'function') {
      bundleCb = bundleOpts;
      bundleOpts = {};
    }
    else {
      bundleOpts = bundleOpts || {};
    }

    // Force debug mode for browserify < 5
    bundleOpts.debug = true;

    // For browserify 5, the bundle must be constructed with debug: true
    if(oldBundle.length === 1) {
      bundleOpts = undefined
    }

    /*
    * If no callback was given, require that the user
    * specified a path to write the sourcemap out to
    */
    if(!bundleStarted && !bundleCb && !minifyifyOpts.output && minifyifyOpts.map) {
      throw new Error('Minifyify: opts.output is required since no callback was given');
    }

    // Call browserify's bundle function and capture the output stream
    bundleStream = oldBundle.call(bundle);

    /*
    * Browserify has this mechanism that delays bundling until all deps
    * are ready, and that means bundle gets called twice. The extra time,
    * it should just pass thru the data instead of trying to consume it.
    */
    if(bundleStarted) {
      return bundleStream;
    }

    if(!bundleStarted) {
      bundleStarted = true;
    }

    /*
    * Pipe browserify's output into the minifier's consumer
    * which has the ability to transform the sourcemap
    */
    bundleStream.pipe(minifier.consumer(function (err, src, map) {
      var finish;

      // A callback we'll need later
      finish = function () {
        // Otherwise, throw if anything bad happened
        if(err) {
          bundleStarted = false;
          throw err;
        }

        // Push the minified src to our proxied stream
        minifiedStream.push(src);
        minifiedStream.push(null);

        bundleStarted = false;
        if(typeof bundleCb == 'function') {
          return bundleCb(err, new Buffer(src), map);
        }
      };


      if (!map && bundle._options.debug) {
        // we don't have any sourcemap data but we browserify is in debug mode
        // so, just pass src through
        finish();
      } else if(minifyifyOpts.minify && minifyifyOpts.output) {
        // Write the sourcemap to the specified output location

        // This is so CLI users get a helpful error when their stuff breaks
        if(!map) {
          throw new Error('Run browserify in debug mode to use minifyify')
        }

        var dir = path.dirname(minifyifyOpts.output);

        // create target directory if it doesn't exist
        if (dir) mkdirp.sync(dir);

        var writeStream = fs.createWriteStream(minifyifyOpts.output);

        // Delay completion until the map is written
        writeStream.on('close', finish);

        writeStream.write(map);
        writeStream.end();
      }
      else {
        finish();
      }
    }));

    // Forward on the error event
    bundleStream.on('error', function (err) {
      bundleStarted = false;
      minifiedStream.emit('error', err)
    })

    // The bundle function should return our proxied stream
    return minifiedStream;
  };
};

module.exports = plugin;
