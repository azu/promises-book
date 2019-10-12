"use strict";
const timeoutPromise = require("../../lib/timeoutPromise").timeoutPromise;
const TimeoutError = require("../../lib/TimeoutError").TimeoutError;
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
