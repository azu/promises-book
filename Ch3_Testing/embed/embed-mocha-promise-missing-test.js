const assert = require("assert");
describe("Promise Test", () => {
    function mayBeRejected() {
        return Promise.resolve();
    }
    it("is unexpected result - pass test", () => {
        // rejectedである時の動作をテストしたい
        // しかし、resolvedだと何も検査されずにPassしてしまう
        return mayBeRejected().catch((error) => {
            assert(error.message === "woo");
        });
    });
});
