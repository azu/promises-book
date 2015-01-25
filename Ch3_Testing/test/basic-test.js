"use strict";
var assert = require("power-assert");
it("should use `done` for test", function (done) {
    setTimeout(function () {
        assert(true);
        done();
    }, 0);
});
