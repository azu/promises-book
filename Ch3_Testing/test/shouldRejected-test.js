"use strict";
const assert = require("power-assert");
const shouldRejected = require("../lib/shouldRejected").shouldRejected;
it("should be rejected", () => {
    const promise = Promise.reject(new Error("human error"));
    return shouldRejected(promise).catch((error) => {
        assert(error.message === "human error");
    });
});