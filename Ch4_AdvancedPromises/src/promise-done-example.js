"use strict";
var done = require("../lib/promise-prototype-done");
var promise = Promise.resolve();
promise.done(function () {
    JSON.parse('this is not json');
    // => SyntaxError: JSON.parse
});
