"use strict";
const assert = require("power-assert");
const timerPromisefy = require("../lib/timer-promisefy").timerPromisefy;

function isPromise(obj) {
    return obj && typeof obj.then === "function";
}
describe("timer-promisefy", () => {
    it("should return promise obejct", () => {
        assert(isPromise(timerPromisefy(1)));
    });
    it("resolve with arged value", () => {
        const time = 2;
        return shouldFulfilled(timerPromisefy(time)).then((value) => {
            assert(value === time);
        });
    });
    it("resolve after arg ms", () => {
        const time = 2;
        const limit = time + 100;
        const now = Date.now();
        return shouldFulfilled(timerPromisefy(time)).then(() => {
            assert(Date.now() - now < limit);
        });
    });
});
