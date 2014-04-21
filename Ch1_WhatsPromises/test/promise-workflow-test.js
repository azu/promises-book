var assert = require('power-assert');
describe('#asyncFunction', function () {
    it("resolve('Async Hello world')が呼ばれる", function () {
        var asyncFunction = require("../src/promise-workflow");
        return shouldFulfilled(asyncFunction()).then(function (value) {
            assert(value == 'Async Hello world');
        });
    });
});