"use strict";
var assert = require("power-assert");
var sinon = require("sinon");
var addDelay = require("../src/promise-resolve-use").addDelay;
describe("addDelay", function () {
    context("when passing non promise object", function () {
        it("should return promise object", function () {
            var result = addDelay(1);
            assert(result instanceof Promise);
        });
        it("could handling promitive value", function () {
            return addDelay(1).then(function (value) {
                assert(value === 1);
            }).catch(function (error) {
                assert.fail(error);
            });
        });
        it("could handling function as value", function () {
            var fn = function () {
                return "result";
            };
            return addDelay(fn).then(function (value) {
                assert(value === fn);
            }).catch(function (error) {
                assert.fail(error);
            });
        });
    });
    context("when passing promise object", function () {
        it("should add delay for promise's resolve", function () {
            var expectedValue = "解決";
            var promise = Promise.resolve(expectedValue);
            return addDelay(promise).then(function (value) {
                assert(value === expectedValue);
            }).catch(function (error) {
                assert.fail(error);
            });
        });
    });
});