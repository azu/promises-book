"use strict";
var promise = Promise.resolve();
promise.then(function () {
    var retPromise = new Promise(function (resolve, reject) {
        // resolve or reject
    });
    return retPromise;// <1>
}).then(onFulfilled, onRejected);
