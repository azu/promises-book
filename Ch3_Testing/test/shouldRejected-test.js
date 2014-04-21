"use strict";
var assert = require("power-assert");
var shouldRejected = require("../lib/shouldRejected").shouldRejected;
it("should be rejected", function () {
    var promise = Promise.reject(new Error("human error"));
    return shouldRejected(promise).catch(function (error) {
        assert(error.message === "human error");
    });
});