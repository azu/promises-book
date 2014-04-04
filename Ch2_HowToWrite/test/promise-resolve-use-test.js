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
            return addDelay("value", 1).then(function (value) {
                assert(value === "value");
            }).catch(function (error) {
                assert.fail(error);
            });
        });
        it("could handling function as value", function () {
            var fn = function () {
                return "result";
            };
            return addDelay(fn, 1).then(function (value) {
                assert(value === fn);
                assert(fn() === "result");
            }).catch(function (error) {
                assert.fail(error);
            });
        });
    });
    context("when passing promise object", function () {
        it("should add delay for promise's resolve", function () {
            var expectedValue = "解決";
            var promise = Promise.resolve(expectedValue);
            return addDelay(promise, 1).then(function (value) {
                assert(value === expectedValue);
            }).catch(function (error) {
                assert.fail(error);
            });
        });
    });
});