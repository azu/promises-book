"use strict";
var assert = require("power-assert");
var sequence = require("../lib/promise-sequence").sequenceTasks;
describe("promise-sequence", function () {
    it("should sequence tasks", function () {
        var promisedIdentity = [1, 2, 4, 8, 16, 32].map(function (value) {
            return function identify() {
                return new Promise(function (resolve) {
                    setTimeout(function () {
                        resolve(value);
                    }, value);
                })
            }
        });
        var startDate = Date.now();
        return sequence(promisedIdentity).then(function (values) {
            console.log(Date.now() - startDate + "ms");// 約64ms
            assert.deepEqual(values, [1, 2, 4, 8, 16, 32]);
        });
    });
});