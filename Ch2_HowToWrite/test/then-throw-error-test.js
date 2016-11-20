"use strict";
var assert = require("power-assert");
describe("#badMain", function () {
    it("can't handling error", function (done) {
        require("../src/then-throw-error").badMain(function (value) {
            assert.fail("doesn't call"); // 呼ばれないはず
        }).catch(function(error) { // 代わりに catch できる
            assert(error instanceof Error)
        });
        setTimeout(function () {
            done();
        }, 100);
    });
});
describe("#goodMain", function () {
    it("can't handling error", function (done) {
        var timeID = null;
        require("../src/then-throw-error").goodMain(function (value) {
            assert(value instanceof Error);
            clearTimeout(timeID);
            done();
        });
        timeID = setTimeout(function () {
            assert.fail("doesn't call");
        }, 5000);
    });
});