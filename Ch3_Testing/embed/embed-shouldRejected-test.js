const assert = require("assert");
function shouldRejected(promise) {
    return {
        "catch": function(fn) {
            return promise.then(() => {
                throw new Error("Expected promise to be rejected but it was fulfilled");
            }, (reason) => {
                fn.call(promise, reason);
            }
            );
        }
    };
}
it("should be rejected", () => {
    const promise = Promise.reject(new Error("human error"));
    return shouldRejected(promise).catch((error) => {
        assert(error.message === "human error");
    });
});