"use strict";
const assert = require("power-assert");
const sequence = require("../lib/promise-sequence").sequenceTasks;
describe("promise-sequence", () => {
    it("should sequence tasks", () => {
        const promisedIdentity = [1, 2, 4, 8, 16, 32].map((value) => {
            return function identify() {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        resolve(value);
                    }, value);
                });
            };
        });
        const startDate = Date.now();
        return sequence(promisedIdentity).then((values) => {
            console.log(Date.now() - startDate + "ms");// 約64ms
            assert.deepEqual(values, [1, 2, 4, 8, 16, 32]);
        });
    });
});
