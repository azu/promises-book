"use strict";
var Deferred = require("./deferred/deferred").Deferred;
function getXHRTimeout(URL) {
    var deferred = new Deferred();
    var req = new XMLHttpRequest();
    req.open('GET', URL, true);
    req.onload = function () {
        if (req.status === 200) {
            deferred.resolve(req.responseText);
        } else {
            deferred.reject(new Error(req.statusText));
        }
    };
    req.onerror = function () {
        reject(new Error(req.statusText));
    };
    req.send();
    deferred.request = req;
    return deferred;
}
function promiseDelay(ms) {
    var now = Date.now();
    return new Promise(function (resolve) {
        setTimeout(function () {
            resolve(Date.now() - now);
        }, ms);
    });
}
function timeoutPromise(promise, ms) {
    var timeout = promiseDelay(ms).then(function () {
        var timeOutError = new Error("Operation timed out after " + ms + " ms");
        timeOutError.name = "timeOutError";
        throw new timeOutError;
    });
    return Promise.race([promise, timeout]);
}

var xhrDeferred = getXHRTimeout('https://api.myjson.com/bins/5r4r');
timeoutPromise(xhrDeferred.promise, 10)
    .then(function (contents) {
        console.log("Here are the contents", contents);
    }).
    catch(function (error) {
        if (error.name === "timeOutError") {
            xhrDeferred.request.abort();
            console.error(error);
            return;
        }
        console.log("XHR Error :", error);
    });
