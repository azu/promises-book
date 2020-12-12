var fixtures = require('./fixtures')
  , utils = require('utilities')
  , fs = require('fs')
  , path = require('path')
  , assert = require('assert')
  , browserify = require('browserify')
  , validate = require('sourcemap-validator')
  , Minifyify = require('../lib/minifier')

  // Helpers
  , compileApp
  , testApp
  , clean = function () {
      utils.file.rmRf( path.join(fixtures.buildDir, 'apps'), {silent: true});
      utils.file.mkdirP( path.join(fixtures.buildDir, 'apps'), {silent: true});
    }

  // Tests
  , tests = {
      "before": clean
    };

compileApp = function (appname, map, next) {
  var opts = {
    compressPath: function (p) {
      return path.relative(path.join(__dirname, 'fixtures', appname), p);
    }
  };

  if(typeof map == 'function') {
    next = map;
    map = 'bundle.map.json';
    opts.map = map;
  }

  if (typeof map == 'object') {
    opts = utils.object.merge(opts, map)
  }

  var bundle = new browserify({debug: true})
    , minifier = new Minifyify(opts);

  bundle.add(fixtures.entryScript(appname));

  bundle = bundle
            .transform(require('coffeeify'))
            .transform(require('hbsfy'))
            .transform(require('brfs'))
            .transform(minifier.transformer)
            .bundle()

  bundle.pipe(minifier.consumer(function (err, src, map) {
    if(err) {
      throw err;
    }

    next(src, map)
  }));
};

/**
* Builds, uploads, and validates an app
*/
testApp = function(appname, cb, opts) {
  var filename = fixtures.bundledFile(appname)
    , mapname = fixtures.bundledMap(appname)
    , destdir = fixtures.bundledDir(appname);

  function validateApp(min, map) {
    // Write to the build dir
    var appdir = path.join(fixtures.buildDir, 'apps', appname);

    utils.file.mkdirP( appdir, {silent: true});

    utils.file.cpR(fixtures.scaffoldDir
      , path.join(fixtures.buildDir, 'apps'), {rename:appname, silent:true});
    utils.file.cpR(path.dirname(fixtures.entryScript(appname))
      , path.join(fixtures.buildDir, 'apps'), {rename:appname, silent:true});
    fs.writeFileSync( path.join(destdir, path.basename(filename)), min );
    fs.writeFileSync( path.join(destdir, path.basename(mapname)), map );

    assert.doesNotThrow(function () {
      validate(min, map);
    }, appname + ' should not throw');

    cb();
  }

  // Compile lib
  opts ? compileApp(appname, opts, validateApp) : compileApp(appname, validateApp);
};

/*
 * 1. Builds the app and validates the source map.
 * 2. Greps the bundle for a NOT_MINIFIED comment, or an special unminified json line.
 * 3. Builds an array of files that were not minified.
 * 3. compares `expected_unminified` to the array of unminified files found
 */
function testFilter(appname, opts, expected_unminified, cb){

  expected_unminified = expected_unminified.slice().sort();

  var actual_unminified = [];

  // scans the created bundle for unminified contents
  function scanUnmodified(pattern){
    var contents = fs.readFileSync(fixtures.bundledFile(appname));
    var match;
    var regex = new RegExp(pattern, 'g');
    while (match = regex.exec(contents)) {
      actual_unminified.push(match[1]);   // The first capture group should contain the file name
    }
  }

  function assertUnminified(){
    // find unminified javascript files
    scanUnmodified("\\/\\/ ([a-zA-Z\\.]+) NOT_MINIFIED");

    // find unminified json files
    scanUnmodified('"unminified":\\s+"([a-zA-Z\\.]+)"');

    actual_unminified.sort();

    assert.deepEqual(actual_unminified,expected_unminified);

    cb();
  }

  testApp(appname, assertUnminified, opts);
}

tests['simple file'] = function (next) {
  testApp('simple file', next);
};

tests['complex file'] = function (next) {
  testApp('complex file', next);
};

tests['complex file with include filter'] = function (next) {
  testFilter(
    'complex file with include filter',
    {include:'**/sub*.js'},
    ['entry.js', 'jsonthing.json'],
    next
  );
};

tests['complex file with exclude filter'] = function (next) {
  testFilter(
    'complex file with exclude filter',
    {exclude:'**/sub*.js'},
    ['submodule.js', 'subsubmodule.js'],
    next
  );
};

tests['complex file with filters'] = function (next) {
  testFilter(
    'complex file with filters',
    {include:['**/*.js'], exclude:['**/subsub*.js', '**/entry.js']},
    ['subsubmodule.js', 'entry.js', 'jsonthing.json'],
    next
  );
};

tests['default base path'] = function (next) {
  console.log(process.cwd())
  testFilter(
    'default base path',
    {include:['**/*.js'], exclude:['test/fixtures/default base path/dirA/*.js', 'dirB/*.js']},
    ['submodule.js',  'jsonthing.json'],  // doesn't exclude dirB
    next
  );
};

tests['custom base path'] = function (next) {
  testFilter(
    'custom base path',
    {include:['**/*.js','*.js'], exclude:['dirA/*.js', 'dirB/*.js'], base:'test/fixtures/custom base path/'},
    ['submodule.js','subsubmodule.js', 'jsonthing.json'],
    next
  );
};

tests['native libs'] = function (next) {
  testApp('native libs', next);
};

tests['brfs app'] = function (next) {
  testApp('brfs app', next);
};

/* Broken because of coffeescript 1.8.0..
 * See: https://github.com/jashkenas/coffeescript/issues/3681
 * See: https://github.com/jashkenas/coffeescript/issues/3672

tests['coffee app'] = function (next) {
  testApp('coffee app', next);
};

*/

tests['backbone app'] = function (next) {
  testApp('backbone app', next);
};

tests['transformed app'] = function (next) {
  testApp('transformed app', next);
};

tests['opts.map = false should not produce a sourcemap'] = function (next) {
  compileApp('simple file', { map : false }, function (min, map) {
    assert.ok(min);
    assert.ok(map == null);
    next();
  });
};

tests['opts.map = true should produce a sourcemap'] = function (next) {
  compileApp('simple file', { map : true }, function (min, map) {
    assert.ok(min);
    assert.ok(map);
    next();
  });
};

tests['opts.sourcesContent = false should produce a map without sourcesContent'] = function (next) {
  compileApp('simple file', { sourcesContent : false }, function (min, map) {
    map = JSON.parse(map, null, 4);
    assert.ok(min);
    assert.ok(map);
    assert.ok(map.sourcesContent == null);
    next();
  });
};

tests['opts.uglify.compress = false should not compress'] = function (next) {
  compileApp('simple file', { uglify: { compress: false, output: { beautify: true } } }, function (min, map) {
    assert.ok(min);
    assert.ok(map);

    // Check that its not compressed
    assert.ok(min.indexOf('header.innerHTML = anotherString;\n\ndocument.body.appendChild(header);') > -1);

    next();
  });
};

module.exports = tests;