/**
 * Created by azu on 2014/04/19.
 * LICENSE : MIT
 */
"use strict";
var assert = require("power-assert");
var shouldFulfilled = require("promise-test-helper").shouldFulfilled;
var shouldRejected = require("promise-test-helper").shouldRejected;
describe("test", function () {
    it("is easy", function () {
        var promise = Promise.reject(new Error("human error"));
        return shouldRejected(promise).catch(function (error) {
            assert(error.message === "human error");
        });
    });
});