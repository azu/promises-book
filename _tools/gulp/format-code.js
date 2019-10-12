var through2 = require('through2');
var reg = /require\(["']power-assert["']\)/g;

function modifier(str) {
    // power-assert -> assert
    // strict use strict
    return str.replace(reg, 'require("assert")').replace(/["']use strict["'];?\n/g, "")
}

function modify() {
    return through2.obj(function (file, encoding, done) {
        var content = modifier(String(file.contents));
        file.contents = new Buffer(content);
        this.push(file);
        done();
    });
}

module.exports = modify;
