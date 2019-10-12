"use strict";
require("../lib/promise-prototype-done");
const promise = Promise.resolve();
promise.done(function() {
    JSON.parse("this is not json");
    // => SyntaxError: JSON.parse
});
