/**
 * Created by azu on 2014/05/02.
 * LICENSE : MIT
 */
"use strict";
var CancellablePromise = require("cancellable-promise-br");
describe("CancellablePromise", function () {
    it("is cancellable promise", function (done) {
        var promise = new CancellablePromise(function (resolve, reject) {
            setTimeout(function () {
                reject(new Error("reason is reasonable"));
            }, 1000);
        });
        promise.onCancel(function (reason) {
            console.log("2. main canceled", reason);
            done();
        });
        var result = promise.then(function (value) {
            console.log(value);
        }).catch(function (error) {
            console.error("-", error);
            done();
        });
        result.onCancel(function () {
            console.log("1. result canceled");
        });
        result.cancel("Da!");
    });
});