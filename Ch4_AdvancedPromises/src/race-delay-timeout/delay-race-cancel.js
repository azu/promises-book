"use strict";

function cancelableXHR(URL) {
    var req = new XMLHttpRequest();
    var promise = new Promise(function (resolve, reject) {
        req.open('GET', URL, true);
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
            reject(new Error("abort this request"));
        };
        req.send();
    });
    var abort = function () {
        // 既にrequestが止まってなければabortする
        // https://developer.mozilla.org/en/docs/Web/API/XMLHttpRequest/Using_XMLHttpRequest
        if (req.readyState !== XMLHttpRequest.UNSENT) {
            req.abort();
        }
    };
    return {
        promise: promise,
        abort: abort
    };
}

module.exports.cancelableXHR = cancelableXHR;
