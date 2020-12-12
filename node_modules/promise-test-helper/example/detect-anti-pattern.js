"use strict";
var assert = require("assert");
var Promise = require("ypromise");
var shouldFulfilled = require("../lib/promise-test-helper").shouldFulfilled;
var shouldRejected = require("../lib/promise-test-helper").shouldRejected;
describe("promise-test-helper", function () {
    beforeEach(function () {
        this.fulfilledPromise = Promise.resolve("value");
        this.rejectedPromise = Promise.reject(new Error("error"));
    });
    describe("Passing good test", function () {
        context("when promise is fulfilled", function () {
            it("should be passed", function () {
                return shouldFulfilled(this.fulfilledPromise).then(function (value) {
                    assert(value === "value");
                })
            });

        });
        context("when promise is rejected", function () {
            it("should be passed", function () {
                return shouldRejected(this.rejectedPromise).catch(function (error) {
                    assert(error instanceof Error);
                });
            });
        });
    });

    // == Bad test pattern
    describe("Detect bad test pattern", function () {
        context("when argument is not promise", function () {
            it("should be failed", function () {
                return shouldFulfilled("string");// is not a promise object
            });
        });
        context("when promise is rejected", function () {
            it("should be failed", function () {
                return shouldFulfilled(this.rejectedPromise).catch(function (error) {
                    assert(error);// expect to fulfilled?
                });
            });
        });
        context("when argument is not promise", function () {
            it("should be failed", function () {
                return shouldRejected("string");// is not a promise object
            });
        });
        context("when promise is fulfilled", function () {
            it("should be failed", function () {
                return shouldRejected(this.fulfilledPromise).then(function (value) {
                    assert(value);// expect to rejected?
                });
            });
            function mayBeRejected() {
                return Promise.resolve();
            }
            it("case : should be failed", function () {
                return shouldRejected(mayBeRejected()).catch(function (error) {
                    assert(error.message === "woo");
                });
            });

        });

    });
});