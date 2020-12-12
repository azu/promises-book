var test = require('tap').test;
var browserify = require('browserify');
var path = require('path');

test('scope', function (t) {
    t.plan(4);
    
    var b = browserify({ node: true });
    b.add(__dirname + '/files/scope');
    b.transform(path.dirname(__dirname));
    
    b.bundle(function (err, src) {
        if (err) t.fail(err);
        t.pass('build success');
        src = src.toString();
        t.ok(src.indexOf("require('fs')") !== -1, 'kept the require call');
        var sentinel = new Buffer('SCOPE_SENTINEL\n', 'utf8').toString('base64')
        var i = src.indexOf(sentinel);
        t.ok(i !== -1, 'read the file');
        i = src.indexOf(sentinel, i + 10);
        t.ok(i !== -1, 'did the require("fs").readFileSync');
    });

});
