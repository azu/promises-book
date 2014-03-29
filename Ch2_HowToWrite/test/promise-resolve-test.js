"use strict";
var assert = require("power-assert");
var promiseCast = require("../src/promise-resolve").promiseCast;
describe("promise.resolve", function () {
    it("cast value to promise object", function () {
        return promiseCast(42).then(function (value) {
            assert(value === 42);
        })
    });
    it("could treat promise object", function () {
        var promise = Promise.resolve(42);
        return promiseCast(promise).then(function (value) {
            assert(value === 42);
        })
    });
});