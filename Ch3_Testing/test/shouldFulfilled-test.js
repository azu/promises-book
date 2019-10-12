"use strict";
const assert = require("power-assert");
const shouldFulfilled = require("../lib/shouldFulfilled").shouldFulfilled;
it("should be fulfilled", () => {
    const promise = Promise.resolve("value");
    return shouldFulfilled(promise).then((value) => {
        assert(value === "value");
    });
});