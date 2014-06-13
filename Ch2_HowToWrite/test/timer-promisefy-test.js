"use strict";
var assert = require("power-assert");
var timerPromisefy = require("../lib/timer-promisefy").timerPromisefy;

function isPromise(obj) {
    return obj && typeof obj.then === 'function';
}
describe("timer-promisefy", function () {
    it("should return promise obejct", function () {
        assert(isPromise(timerPromisefy(1)));
    });
    it("resolve with arged value", function () {
        var time = 2;
        return shouldFulfilled(timerPromisefy(time)).then(function (value) {
            assert(value === time);
        });
    });
    it("resolve after arg ms", function () {
        var time = 2;
        var limit = time + 100;
        var now = Date.now();
        return shouldFulfilled(timerPromisefy(time)).then(function (value) {
            assert(Date.now() - now < limit);
        });
    });
});