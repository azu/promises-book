"use strict";
var assert = require("power-assert");
describe("Promise Test", function () {
    it("should return a promise object", function () {
        var promise = Promise.resolve(42);
        return promise.then(function (value) {
            assert(value === 42);
        });
    });
});
