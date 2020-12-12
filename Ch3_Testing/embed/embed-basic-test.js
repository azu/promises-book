const assert = require("assert");
it("should use `done` for test", (done) => {
    setTimeout(() => {
        assert(true);
        done();
    }, 0);
});
