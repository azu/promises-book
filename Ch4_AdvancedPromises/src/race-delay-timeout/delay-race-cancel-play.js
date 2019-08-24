"use strict";
var timeoutPromise = require("../../lib/timeoutPromise").timeoutPromise;
var cancelableXHR = require("./delay-race-cancel").cancelableXHR;
var object = cancelableXHR('https://httpbin.org/get');
// main
timeoutPromise(object.promise, 1000)
    .then(function (contents) {
        console.log("Contents", contents);
    }).
    catch(function (error) {
        if (error instanceof TimeoutError) {
            object.abort();
            console.error(error);
            return;
        }
        console.log("XHR Error :", error);
    });
