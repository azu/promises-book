var test = require('tape');
var concat = require('concat-stream');
var staticModule = require('../');
var fs = require('fs');
var path = require('path');

test('keep requires if their uses cannot be resolved', function (t) {
    t.plan(1);
    
    var sm = staticModule({
        'insert-css': function (src) {
            return JSON.stringify(hash(src));
        }
    });
    readStream('source.js').pipe(sm).pipe(concat(function (body) {
        t.equal(body.toString('utf8'),
            'var insertCSS = require(\'insert-css\');\n'
            + '\n' +
            '"_4e552b4ec7";\n' +
            '// can\'t replace this\n' +
            'insertCSS(window.__style);\n'
        );
    }));
});

test('keep requires if they are still used', function (t) {
    t.plan(3);
    var filename = path.join(__dirname, 'keep-used/fs.js');
    var expected = [
        "contents",
        fs.statSync(filename).size
    ];
    var sm = staticModule({
        fs: {
            readFileSync: function () {
                return '"contents"';
            }
        }
    }, { vars: { __filename: filename } });
    readStream('fs.js').pipe(sm).pipe(concat(function (body) {
        t.equal(body.toString('utf8'),
            'fs = require(\'fs\'),\n'
            + '\n'
            + '    console.log("contents"),\n'
            + '    console.log(fs.statSync(__filename).size)\n'
        );
        var fn = Function('require', '__filename', 'console', body.toString('utf8'));
        fn(require, filename, {
            log: function (v) {
                t.equal(v, expected.shift());
            }
        });
    }));
});

function readStream (file) {
    return fs.createReadStream(path.join(__dirname, 'keep-used', file));
}
function hash (str) {
    return '_' + require('crypto').createHash('sha256').update(str).digest('hex').slice(0, 10);
}
