#!/usr/bin/env node
var toAssert = require('../').toAssertFromSource;
var concat = require('concat-stream');
var fs = require('fs');
var path = require("path");
var file = process.argv[2];
var input = file && file !== '-'
        ? fs.createReadStream(process.argv[2])
        : process.stdin
    ;
input.pipe(concat(function (buf) {
    var filePath = path.join(process.cwd(), file);
    console.log(toAssert(buf.toString('utf8'), filePath));
}));