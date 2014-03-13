"use strict";
var assert = require("power-assert");
var nock = require('nock');
var http = require('http');
describe("multiple-xhr", function () {
    it("should ", function (done) {
        require("../src/multiple-xhr")(function (value) {
            assert.deepEqual(value, "test");
            done();
        });
    });
});

