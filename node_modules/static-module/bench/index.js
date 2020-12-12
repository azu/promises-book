var bench = require('nanobench');
var fs = require('fs');
var path = require('path');
var through = require('through2');

bench('small file × 5', function (b) {
    warmup(run, function () {
        b.start();

        var i = 5;
        run(function next () {
            if (--i === 0) b.end();
            else run(next);
        });
    });

    function run (cb) {
        smallFile()
            .pipe(brfs())
            .on('data', function () {})
            .on('end', function () {
                cb();
            });
    }
});

bench('large file without fs', function (b) {
    warmup(run, function () {
        b.start();

        var i = 5;
        run(function next () {
            if (--i === 0) b.end();
            else run(next);
        });
    });

    function run (cb) {
        largeFile()
            .pipe(brfs())
            .on('data', function () {})
            .on('end', function () {
                b.end();
            });
    }
});

bench('large file with fs', function (b) {
    warmup(run, function () {
        b.start();

        var i = 5;
        run(function next () {
            if (--i === 0) b.end();
            else run(next);
        });
    });

    function run (cb) {
        largeFile()
            .pipe(withFS())
            .pipe(brfs())
            .on('data', function () {})
            .on('end', function () {
                b.end();
            });
    }
});

function brfs () {
    return require('../')({
        fs: {
            readFileSync: function (path) {
                return path;
            }
        }
    });
}

function smallFile () {
    var r = through();
    r.end('var a, fs = require("fs"), x; fs.readFileSync("index.js");');
    return r;
}
function largeFile () {
    return fs.createReadStream(path.join(__dirname, './input.js'));
}
function withFS () {
    return through(function (chunk, enc, next) {
        next(null, chunk);
    }, function (next) {
        this.push('\nvar a, fs = require("fs"), x; fs.readFileSync("index.js");');
        next();
    });
}

function warmup (run, cb) {
    var i = 5;
    run(function next () {
        if (--i === 0) cb();
        else run(next);
    });
}
