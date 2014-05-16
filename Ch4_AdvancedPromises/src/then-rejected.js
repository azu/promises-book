"use strict";
var promise = Promise.resolve();
promise.then(function () {
    return Promise.reject(new Error("this promise is rejected"));
}).then(console.log.bind(console), console.error.bind(console));
