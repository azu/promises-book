"use strict";
var requestMap = {};
function createXHRPromise(URL) {
    var req = new XMLHttpRequest();
    var promise = new Promise(function (resolve, reject) {
        req.open('GET', URL, true);
        req.onreadystatechange = function () {
            if (req.readyState === XMLHttpRequest.DONE) {
                delete requestMap[URL];
            }
        };
        req.onload = function () {
            if (req.status === 200) {
                resolve(req.responseText);
            } else {
                reject(new Error(req.statusText));
            }
        };
        req.onerror = function () {
            reject(new Error(req.statusText));
        };
        req.onabort = function () {
            reject(new Error('abort this req'));
        };
        req.send();
    });
    requestMap[URL] = {
        promise: promise,
        request: req
    };
    return promise;
}

function abortPromise(promise) {
    if (typeof promise === "undefined") {
        return;
    }
    var request;
    Object.keys(requestMap).some(function (URL) {
        if (requestMap[URL].promise === promise) {
            request = requestMap[URL].request;
            return true;
        }
    });
    if (request != null && request.readyState !== XMLHttpRequest.UNSENT) {
        request.abort();
    }
}
module.exports.createXHRPromise = createXHRPromise;
module.exports.abortPromise = abortPromise;
