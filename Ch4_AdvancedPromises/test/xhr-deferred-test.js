"use strict";
var assert = require('power-assert');
var getURL = require("../src/deferred/xhr-deferred").getURL;

require("http-echo");
describe('#cancelableXHR', function () {
    describe("when get data", function () {
        it("should resolve with value", function () {
            var URL = "http://localhost:3000/?status=200&body=text";
            return shouldFulfilled(getURL(URL)).then(function (value) {
                assert.equal(value, "text");
            });
        });
    });
    describe("when get fail", function () {
        it("should reject with error", function () {
            var URL = "http://localhost:3000/?status=500";
            return shouldRejected(getURL(URL)).catch(function (error) {
                assert(error instanceof Error);
            });
        });
    });

});