"use strict";
var assert = require("power-assert");
var timeoutPromise = require("../lib/timeoutPromise").timeoutPromise;
var TimeoutError = require("../lib/TimeoutError").TimeoutError;
describe("timeoutPromise", function () {
    it("handling timeout", function () {
        var taskPromise = new Promise(function (resolve) {
            // 何かの処理
            var result = "...";
            resolve(result);
        });
        return shouldFulfilled(timeoutPromise(taskPromise, 1000)).then(function (value) {
            assert(value === "...");
        });
    });
    it("time is over", function () {
        var taskPromise = new Promise(function (resolve) {
            setTimeout(resolve, 10000);
        });
        return shouldRejected(timeoutPromise(taskPromise, 1)).catch(function (value) {
            assert(value instanceof TimeoutError);
        });
    });
});