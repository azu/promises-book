/**
 * Created by azu on 2014/04/20.
 * LICENSE : MIT
 */
"use strict";
var assert = require("assert");
var Promise = require("ypromise");
var shouldFulfilled = require("../lib/promise-test-helper").shouldFulfilled;
var shouldRejected = require("../lib/promise-test-helper").shouldRejected;

var resolvedPromiseValue = "value",
    rejectedPromiseUnwrapValue = "error";
var fulfilledPromise, rejectedPromise;
describe("promise-test-helper", function () {
    beforeEach(function () {
        fulfilledPromise = Promise.resolve(resolvedPromiseValue);
        rejectedPromise = Promise.reject(new Error(rejectedPromiseUnwrapValue));
    });
    describe("#shouldFulfilled", function () {
        context("when argument is not promise", function () {
            it("should be failed", function () {
                assert.throws(function () {
                    shouldFulfilled("string");
                }, Error);
            });
        });
        // Expected Workflow : fulfilledPromise => then
        context("when promise is fulfilled", function () {
            context("case: no method chain", function () {
                it("should be passed", function () {
                    return shouldFulfilled(fulfilledPromise);
                });
            });
            it("should be passed", function () {
                return shouldFulfilled(fulfilledPromise).then(function (value) {
                    assert(value === "value");
                })
            });
        });
        // rejectedPromise
        context("when promise is rejected", function () {
            it("should be failed", function () {
                return shouldFulfilled(rejectedPromise).then().catch(function (error) {
                    assert(error instanceof Error);
                    assert.equal(error.message, "error");
                });
            });
        });
        context("when use `catch` as method chain", function () {
            it("should be failed - has no method 'then'", function () {
                assert.throws(function () {
                    shouldFulfilled(rejectedPromise).catch(function () {
                    });
                }, Error);
            });
        });
    });

    describe("#shouldRejected", function () {
        context("when argument is not promise", function () {
            it("should be failed", function () {
                assert.throws(function () {
                    shouldRejected("string");
                }, Error);
            });
        });
        context("when use `then` as method chain", function () {
            it("should be failed - has no method 'then'", function () {
                assert.throws(function () {
                    shouldRejected(fulfilledPromise).then(function () {
                        assert(true);
                    });
                }, Error);
            });
        });
        context("when promise is fulfilled", function () {
            it("should be failed and show `resolvedPromiseValue`", function (done) {
                shouldRejected(fulfilledPromise).catch(function (error) {
                    done(new Error("shouldRejected(fulfilledPromise) should not call catch"))
                }).catch(function (error) {// expected helper return rejected promise
                    assert(error instanceof Error);
                    assert.equal(error.message, "Expected promise to be rejected but it was fulfilled: " + resolvedPromiseValue);
                }).then(done, done);
            });
            context("and promise fulfilled undefined", function () {
                it("should be failed", function (done) {
                    shouldRejected(Promise.resolve()).catch(function (error) {
                        done(new Error("shouldRejected(fulfilledPromise) should not call catch"))
                    }).catch(function (error) {// expected helper return rejected promise
                        assert(error instanceof Error);
                        assert.equal(error.message, "Expected promise to be rejected but it was fulfilled");
                    }).then(done, done);
                });

            });
        });
        // Expected Workflow : rejectedPromise => catch
        context("when promise is rejected", function () {
            context("case: no method chain", function () {
                it("should be passed", function () {
                    return shouldRejected(rejectedPromise);
                });
            });
            it("should be passed", function () {
                return shouldRejected(rejectedPromise).catch(function (error) {
                    assert(error instanceof Error);
                });
            });
        });
    });
});