const assert = require("assert");
const ArrayAsPromise = require("../src/promise-chain/array-promise-chain");
describe("array-promise-chain", () => {
    function isEven(value) {
        return value % 2 === 0;
    }

    function double(value) {
        return value * 2;
    }

    beforeEach(function() {
        this.array = [1, 2, 3, 4, 5];
    });
    describe("Native array", () => {
        it("can method chain", function() {
            const result = this.array.filter(isEven).map(double);
            assert.deepEqual(result, [4, 8]);
        });
    });
    describe("ArrayAsPromise", () => {
        it("can promise chain", function(done) {
            const array = new ArrayAsPromise(this.array);
            array.filter(isEven).map(double).then((value) => {
                assert.deepEqual(value, [4, 8]);
            }).then(done, done);
        });
    });
});