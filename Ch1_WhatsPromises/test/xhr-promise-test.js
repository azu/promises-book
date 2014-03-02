var assert = require('power-assert');
require("http-echo");
describe('#getURL', function () {
    describe("when get data", function () {
        it("should resolve with value", function (done) {
            var getURL = require("../src/xhr-promise");
            var URL = "http://localhost:3000/?status=200&body=text";
            getURL(URL).then(function (value) {
                assert(value === "text");
                done();
            }).catch(done);
        });
    });
    describe("when get fail", function () {
        it("should reject with error", function (done) {
            var getURL = require("../src/xhr-promise");
            var URL = "http://localhost:3000/?status=500";
            getURL(URL).catch(function(error){
                assert(error instanceof Error);
                done();
            });
        });
    });

});