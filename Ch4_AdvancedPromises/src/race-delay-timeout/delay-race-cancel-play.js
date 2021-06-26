"use strict";
const TimeoutError = require("../../lib/TimeoutError").TimeoutError;
const delayPromise = require("../../lib/delayPromise").delayPromise;
function timeoutPromise(promise, ms) {
    const timeout = delayPromise(ms).then(() => {
        return Promise.reject(new TimeoutError("Operation timed out after " + ms + " ms"));
    });
    return Promise.race([promise, timeout]);
}
const cancelableXHR = require("./delay-race-cancel").cancelableXHR;
const object = cancelableXHR("https://httpbin.org/get");
// main
timeoutPromise(object.promise, 1000)
    .then((contents) => {
        console.log("Contents", contents);
    }).
    catch((error) => {
        if (error instanceof TimeoutError) {
            object.abort();
            console.error(error);
            return;
        }
        console.log("XHR Error :", error);
    });
