"use strict";
var TimeoutError = require("./TimeoutError").TimeoutError;
var delayPromise = require("./delayPromise").delayPromise;
function timeoutPromise(promise, ms) {
    var timeout = delayPromise(ms).then(function () {
        throw new TimeoutError("Operation timed out after " + ms + " ms");
    });
    return Promise.race([promise, timeout]);
}
module.exports.timeoutPromise = timeoutPromise;