"use strict";
var TimeoutError = require("./TimeoutError").TimeoutError;
var delayPromise = require("./delayPromise").delayPromise;
function timeoutPromise(promise, ms) {
    var timeout = new Promise(function (resolve, reject) {
        return delayPromise(ms).then(function () {
            reject(new TimeoutError("Operation timed out after " + ms + " ms"));
        })
    });
    return Promise.race([promise, timeout]);
}
module.exports.timeoutPromise = timeoutPromise;