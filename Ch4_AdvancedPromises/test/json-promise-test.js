"use strict";
var assert = require("power-assert");
var JSONPromise = require("../lib/json-promise").JSONPromise;
describe("json-promise", function () {
    context("When json string", function () {
        it("should return object", function () {
            return shouldFulfilled(JSONPromise("{}")).then(function (object) {
                assert(typeof object === "object");
            })
        });
    });
    context("When non-json string", function () {
        it("should rejected", function () {
            return shouldRejected(JSONPromise("this is not json")).catch(function (error) {
                assert(error instanceof SyntaxError);
            })
        });
    });
});