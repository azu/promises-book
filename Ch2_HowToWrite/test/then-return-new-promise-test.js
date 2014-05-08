"use strict";
var assert = require("power-assert");
describe("promise.then ", function () {
    it("should return new promise object", function () {
        var aPromise = new Promise(function (resolve) {
            resolve(100);
        });
        var thenPromise = aPromise.then(function (value) {
            console.log(value);
        });
        var catchPromise = thenPromise.catch(function (error) {
            console.log(error);
        });
        assert(aPromise !== thenPromise);
        assert(thenPromise !== catchPromise);
    });
});