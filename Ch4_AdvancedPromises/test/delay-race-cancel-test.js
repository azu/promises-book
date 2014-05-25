"use strict";
var assert = require("power-assert");
var cancelableXHR = require("../src/race-delay-timeout/delay-race-cancel").cancelableXHR;
var TimeoutError = require("../lib/TimeoutError").TimeoutError;
var timeoutPromise = require("../lib/timeoutPromise").timeoutPromise;
var delayPromise = require("../lib/delayPromise").delayPromise;
describe("delay-race-cancel", function () {
    context("When promise is fulfilled", function () {
        it("should Fulfilled", function () {
            var promise = Promise.resolve("value");
            var rancePromise = timeoutPromise(promise, 10);
            return shouldFulfilled(rancePromise).then(function (content) {
                assert(content === "value");
            })
        });
    });
    context("When race winner is timeout promise", function () {
        it("should Rejected", function () {
            // 10ms => timeout => 1000ms
            var promise = delayPromise(1000);
            var rancePromise = timeoutPromise(promise, 10);
            return shouldRejected(rancePromise).catch(function (error) {
                assert(error instanceof TimeoutError);
            })
        });
    });
});