"use strict";
const TimeoutError = require("./TimeoutError").TimeoutError;
const delayPromise = require("./delayPromise").delayPromise;
function timeoutPromise(promise, ms) {
    const timeout = delayPromise(ms).then(() => {
        return Promise.reject(new TimeoutError("Operation timed out after " + ms + " ms"));
    });
    return Promise.race([promise, timeout]);
}
module.exports.timeoutPromise = timeoutPromise;