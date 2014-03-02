var assert = require('power-assert');
describe('#asyncFunction', function () {
    it("resolve('Async Hello world')が呼ばれる", function (done) {
        require("../src/promise-workflow")().then(function (value) {
            assert(value == 'Async Hello world');
            done();
        });
    });
});