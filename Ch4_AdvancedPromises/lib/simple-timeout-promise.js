"use strict";
const delayPromise = require("./delayPromise").delayPromise;
function timeoutPromise(promise, ms) {
    const timeout = delayPromise(ms).then(() => {
        throw new Error("Operation timed out after " + ms + " ms");
    });
    return Promise.race([promise, timeout]);
}
module.exports.timeoutPromise = timeoutPromise;
