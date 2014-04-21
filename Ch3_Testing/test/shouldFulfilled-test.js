"use strict";
var assert = require("power-assert");
var shouldFulfilled = require("../lib/shouldFulfilled").shouldFulfilled;
it("should be fulfilled", function () {
    var promise = Promise.resolve("value");
    return shouldFulfilled(promise).then(function (value) {
        assert(value === "value");
    });
});