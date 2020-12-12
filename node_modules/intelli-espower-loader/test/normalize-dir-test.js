"use strict";
var assert = require("assert");
var path = require("path");
var normalizeDir = require("../lib/normalize-dir");
describe("normalize-dir", function () {
    context("When string is ended with slash", function () {
        var string = ["path", "to", "file"].join(path.sep) + path.sep;
        it("should return same string", function () {
            assert.equal(normalizeDir(string), string);
        });
    });
    context("When string is ended without slash", function () {
        var string = ["path", "to", "file"].join(path.sep);
        it("should append slash", function () {
            assert.equal(normalizeDir(string), string + path.sep);
        });
    });
});