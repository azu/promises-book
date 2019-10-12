"use strict";
const assert = require("power-assert");
describe("#badMain", () => {
    it("can't handling error", (done) => {
        require("../src/then-throw-error").badMain(() => {
            assert.fail("doesn't call"); // 呼ばれないはず
        }).catch((error) => { // 代わりに catch できる
            assert(error instanceof Error);
        });
        setTimeout(() => {
            done();
        }, 100);
    });
});
describe("#goodMain", () => {
    it("can't handling error", (done) => {
        let timeID = null;
        require("../src/then-throw-error").goodMain((value) => {
            assert(value instanceof Error);
            clearTimeout(timeID);
            done();
        });
        timeID = setTimeout(() => {
            assert.fail("doesn't call");
        }, 5000);
    });
});
