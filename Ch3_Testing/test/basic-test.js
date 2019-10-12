"use strict";
const assert = require("power-assert");
it("should use `done` for test", (done) => {
    setTimeout(() => {
        assert(true);
        done();
    }, 0);
});
