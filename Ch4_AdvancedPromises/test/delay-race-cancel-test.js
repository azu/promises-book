"use strict";
const assert = require("power-assert");
const TimeoutError = require("../lib/TimeoutError").TimeoutError;
const timeoutPromise = require("../lib/timeoutPromise").timeoutPromise;
const delayPromise = require("../lib/delayPromise").delayPromise;
describe("delay-race-cancel", () => {
    context("When promise is fulfilled", () => {
        it("should Fulfilled", () => {
            const promise = Promise.resolve("value");
            const rancePromise = timeoutPromise(promise, 10);
            return shouldFulfilled(rancePromise).then((content) => {
                assert(content === "value");
            });
        });
    });
    context("When race winner is timeout promise", () => {
        it("should Rejected", () => {
            // 10ms => timeout => 1000ms
            const promise = delayPromise(1000);
            const rancePromise = timeoutPromise(promise, 10);
            return shouldRejected(rancePromise).catch((error) => {
                assert(error instanceof TimeoutError);
            });
        });
    });
});
