"use strict";
const assert = require("power-assert");
const addDelay = require("../src/promise-resolve-use").addDelay;
describe("addDelay", () => {
    context("when passing non promise object", () => {
        it("should return promise object", (done) => {
            const result = addDelay(1).catch(done);
            assert(result instanceof Promise);
            done();
        });
        it("could handling promitive value", () => {
            return shouldFulfilled(addDelay("value", 1)).then((value) => {
                assert(value === "value");
            });
        });
        it("could handling function as value", () => {
            const fn = function() {
                return "result";
            };
            return shouldFulfilled(addDelay(fn, 1)).then((value) => {
                assert(value === fn);
                assert(fn() === "result");
            });
        });
    });
    context("when passing promise object", () => {
        it("should add delay for promise's resolve", () => {
            const expectedValue = "解決";
            const promise = Promise.resolve(expectedValue);
            return shouldFulfilled(addDelay(promise, 1)).then((value) => {
                assert(value === expectedValue);
            });
        });
    });
});
