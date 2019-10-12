"use strict";
const assert = require("power-assert");
const promiseCast = require("../src/promise-resolve").promiseCast;
describe("promise.resolve", () => {
    it("cast value to promise object", () => {
        return promiseCast(42).then((value) => {
            assert(value === 42);
        });
    });
    it("could treat promise object", () => {
        const promise = Promise.resolve(42);
        return promiseCast(promise).then((value) => {
            assert(value === 42);
        });
    });
});