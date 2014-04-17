"use strict";
var assert = require("power-assert");
describe("Promise Test", function () {
    it("should return a promise object", function () {
        var promise = Promise.resolve(1);
        return promise.then(function (value) {
            assert(value === 1);
        });
    });
    function throwError(value) {
        throw new Error(value);
    }

    function mayBeRejected() {
        return Promise.reject(new Error("woo"));
    }

    it("should bad pattern", function () {
            return mayBeRejected().then(throwError, function (error) {
            assert(error.message === "woo");
        });
    });
});
