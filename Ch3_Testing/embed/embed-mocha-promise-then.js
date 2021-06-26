/**
 * Created by azu on 2014/04/20.
 * LICENSE : MIT
 */
const assert = require("assert");
function failTest(value) {
    throw new Error(value);
}

function mayBeRejected() {
    return Promise.reject(new Error("woo"));
}

it("should then pattern", () => {
    return mayBeRejected().then(failTest, (error) => {
        assert(error.message === "woo");
    });
});