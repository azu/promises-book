/**
 * Created by azu on 2014/03/06.
 * LICENSE : MIT
 */
"use strict";
var assert = require("power-assert");
var promisedMapping = require("../experiments/promised-mapping");
describe("#promisedMapping", function () {
    context("When passing []", function () {
        it("should return []", function () {
            assert.deepEqual(promisedMapping([]), []);
        });
    });
    context("When passing [1,2,4]", function () {
        it("should return [p(1),p(2),p(4)]", function () {
            var promiseMap = promisedMapping([1, 2, 4]);
            return shouldFulfilled(Promise.all(promiseMap)).then(function (values) {
                assert.deepEqual(values, [1, 2, 4]);
            });
        });
    });
});
