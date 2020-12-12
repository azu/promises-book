var rename = require('gulp-rename')
var srcStream = require('./')
var vfs = require('vinyl-fs')
var test = require('tape')
var path = require('path')
var fs = require('fs')
var through = require('through2');

function upper() {
  return through(function(chunk, _, cb) {
    var str = chunk.toString().toUpperCase();
    cb(null, new Buffer(str));
  });
}

test('capitalizing test file', function(t) {
  fs.createReadStream(__filename)
    .pipe(srcStream(__filename))
    .pipe(through.obj(function(file, _, cb) {
      file.contents = file.contents.pipe(upper());
      cb(null, file);
    }))
    .pipe(rename("fixture.js"))
    .pipe(vfs.dest('.'))
    .once('end', function() {
      // gulp.dest finishes before writing
      // the file is complete...
      setTimeout(function() {
        t.pass('reached pipline "end" event')
        t.equal(
            fs.readFileSync(__dirname + '/fixture.js', 'utf8')
          , fs.readFileSync(__filename, 'utf8').toUpperCase()
          , 'transformed contents as expected'
        )

        fs.unlink(__dirname + '/fixture.js', function(err) {
          t.ifError(err, 'removed fixture successfully')
          t.end()
        })
      }, 1500)
    })
})

test('baseDir: defaults to process.cwd()', function(t) {
  process.chdir(path.resolve(__dirname, '..', '..'))

  fs.createReadStream(__filename)
    .pipe(srcStream(path.basename(__filename)))
    .on('data', function(file) {
      t.equal(process.cwd(), path.dirname(file.path), 'defaults to process.cwd()')

      process.chdir(__dirname)

      t.end()
    })
})
