const assert = require("power-assert");
describe("#asyncFunction", () => {
    it("resolve('Async Hello world')が呼ばれる", () => {
        const asyncFunction = require("../src/promise-workflow");
        return shouldFulfilled(asyncFunction()).then((value) => {
            assert(value == "Async Hello world");
        });
    });
});