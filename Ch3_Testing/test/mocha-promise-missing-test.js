"use strict";
var assert = require("power-assert");
describe("Promise Test", function () {
    function mayBeRejected(){
        return Promise.resolve();
    }
    it("is unexpected result - pass test", function () {
        // rejectedである時の動作をテストしたい
        // しかし、resolvedだと何も検査されずにPassしてしまう
        return mayBeRejected().catch(function (error) {
            assert(error.message === "woo");
        });
    });
});
