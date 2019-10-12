/**
 * Created by azu on 2014/03/06.
 * LICENSE : MIT
 */
"use strict";
const assert = require("power-assert");
const promisedMapping = require("../experiments/promised-mapping");
describe("#promisedMapping", () => {
    context("When passing []", () => {
        it("should return []", () => {
            assert.deepEqual(promisedMapping([]), []);
        });
    });
    context("When passing [1,2,4]", () => {
        it("should return [p(1),p(2),p(4)]", () => {
            const promiseMap = promisedMapping([1, 2, 4]);
            return shouldFulfilled(Promise.all(promiseMap)).then((values) => {
                assert.deepEqual(values, [1, 2, 4]);
            });
        });
    });
});
