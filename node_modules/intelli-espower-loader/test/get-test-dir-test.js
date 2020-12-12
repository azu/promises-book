// LICENSE : MIT
"use strict";
var assert = require("assert");
var getTestDir = require("../lib/get-test-dir");
describe("get-test-dir-test", function () {
    context("when package.json does not have directories properties", function () {
        it("should return directories properties", function () {
            var packageJsonMock = {};
            var expected = "test/";
            assert.equal(getTestDir(packageJsonMock), expected);
        });
    });
    context("when `pkg.directories.test` is not found", function () {
        it("should return 'test/'", function () {
            var dir = getTestDir({
                "directories": {}
            });
            var expected = "test/";
            assert.equal(dir, expected);
        });
    });
    context("when `pkg.directories.test` is set", function () {
        it("should return 'user-dir/'", function () {
            var dir = getTestDir({
                "directories": {
                    "test": "user-dir"
                }
            });
            var expected = "user-dir/";
            assert.equal(dir, expected);
        });
    });

});