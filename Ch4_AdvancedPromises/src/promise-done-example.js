"use strict";
const done = require("../lib/promise-prototype-done");
const promise = Promise.resolve();
promise.done(() => {
    JSON.parse("this is not json");
    // => SyntaxError: JSON.parse
});
