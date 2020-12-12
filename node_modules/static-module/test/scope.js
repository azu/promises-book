var test = require('tape');
var concat = require('concat-stream');
var staticModule = require('../');
var fs = require('fs');
var path = require('path');

test('scope tracking', function (t) {
    t.plan(2);
    
    var sm = staticModule({
        fs: {
            readFileSync: function () { return '"read the file!"' }
        }
    });
    readStream('source.js').pipe(sm).pipe(concat(function (body) {
        Function(['T'],body)(t);
    }));
});

test('block scope', { skip: !supportsBlockScope() }, function (t) {
    t.plan(2);
    
    var sm = staticModule({
        fs: {
            readFileSync: function () { return '"read the file!"' }
        }
    });
    readStream('block.js').pipe(sm).pipe(concat(function (body) {
        Function(['T'],body)(t);
    }));
});

function readStream (file) {
    return fs.createReadStream(path.join(__dirname, 'scope', file));
}
function supportsBlockScope () {
    try {
        return eval('{ let a = true; a }');
    } catch (err) {
        return false;
    }
}
