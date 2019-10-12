"use strict";
const assert = require("power-assert");
const timeoutPromise = require("../lib/timeoutPromise").timeoutPromise;
const TimeoutError = require("../lib/TimeoutError").TimeoutError;
describe("timeoutPromise", () => {
    it("handling timeout", () => {
        const taskPromise = new Promise((resolve) => {
            // 何かの処理
            const result = "...";
            resolve(result);
        });
        return shouldFulfilled(timeoutPromise(taskPromise, 1000)).then((value) => {
            assert(value === "...");
        });
    });
    it("time is over", () => {
        const taskPromise = new Promise((resolve) => {
            setTimeout(resolve, 10000);
        });
        return shouldRejected(timeoutPromise(taskPromise, 1)).catch((value) => {
            assert(value instanceof TimeoutError);
        });
    });
});
