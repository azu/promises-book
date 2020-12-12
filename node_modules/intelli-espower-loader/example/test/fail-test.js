// LICENSE : MIT
"use strict";
var assert = require("power-assert");
describe("FailTest", function () {
    it("is failed", function () {
        var object = {
            name: "Tom object"
        };
        assert.deepEqual(object, {
            name: "Mom object"
        });
    });
});