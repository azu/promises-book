const assert = require("assert");
function shouldFulfilled(promise) {
    return {
        "then": function(fn) {
            return promise.then((value) => {
                fn.call(promise, value);
            }, (reason) => {
                throw reason;
            }
            );
        }
    };
}
it("should be fulfilled", () => {
    const promise = Promise.resolve("value");
    return shouldFulfilled(promise).then((value) => {
        assert(value === "value");
    });
});