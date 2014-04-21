"use strict";
var assert = require("power-assert");
var sinon = require("sinon");
var addDelay = require("../src/promise-resolve-use").addDelay;
describe("addDelay", function () {
    context("when passing non promise object", function () {
        it("should return promise object", function (done) {
            var result = addDelay(1).catch(done);
            assert(result instanceof Promise);
            done();
        });
        it("could handling promitive value", function () {
            return shouldFulfilled(addDelay("value", 1)).then(function (value) {
                assert(value === "value");
            })
        });
        it("could handling function as value", function () {
            var fn = function () {
                return "result";
            };
            return shouldFulfilled(addDelay(fn, 1)).then(function (value) {
                assert(value === fn);
                assert(fn() === "result");
            });
        });
    });
    context("when passing promise object", function () {
        it("should add delay for promise's resolve", function () {
            var expectedValue = "解決";
            var promise = Promise.resolve(expectedValue);
            return shouldFulfilled(addDelay(promise, 1)).then(function (value) {
                assert(value === expectedValue);
            });
        });
    });
});