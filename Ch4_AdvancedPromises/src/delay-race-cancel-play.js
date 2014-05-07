"use strict";
var timeoutPromise = require("../lib/timeoutPromise").timeoutPromise;
var cancelableXHR = require("./delay-race-cancel").cancelableXHR;
var object = cancelableXHR('https://api.myjson.com/bins/5r4r');
timeoutPromise(object.promise, 1000)
    .then(function (contents) {
        console.log("Contents", contents);
    }).
    catch(function (error) {
        if (error instanceof TimeoutError) {
            object.abort();
            return console.log(error);
        }
        console.log("XHR Error :", error);
    });