var assert = require('power-assert');
var fetchURL = require("../src/xhr-promise").fetchURL;
var echoServer = require("../../test/echo-server");
describe('#fetchURL', function () {
    beforeEach(() => {
        return echoServer.start();
    });
    afterEach(() => {
        return echoServer.stop();
    });
    describe("when get data", function () {
        it("should resolve with value", function () {
            var URL = "http://localhost:3000/?status=200&body=text";
            return shouldFulfilled(fetchURL(URL)).then(function (value) {
                assert.equal(value, "text");
            });
        });
    });
    describe("when get fail", function () {
        it("should reject with error", function () {
            var URL = "http://localhost:3000/?status=500";
            return shouldRejected(fetchURL(URL)).catch(function (error) {
                assert(error instanceof Error);
            });
        });
    });
});
