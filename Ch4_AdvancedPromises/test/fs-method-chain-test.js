"use strict";
var assert = require("power-assert");
var fs = require("fs-extra");
var File = require("../src/promise-chain/fs-method-chain");
File.prototype.then = function (fn) {
    fn.call(this, this.lastValue);
    return this;
};
describe("File", function () {
    var fixtureDir = __dirname + "/__fixtures";
    var inputFilePath = fixtureDir + "/input.txt";
    beforeEach(function () {
        fs.copySync(__dirname + "/fixtures", fixtureDir);
    });
    afterEach(function () {
        fs.removeSync(fixtureDir);
    });
    describe("read", function () {
        context("when not found", function () {
            it("should reject", function () {
                File.read(inputFilePath)
                    .then(function (content) {
                        assert(content === "INPUT INPUT");
                    });
            });
        });
        context("when found file", function () {
            it("can method chain", function () {
                var file = File.read(inputFilePath);
                assert(file instanceof File);
            });
            it("should passing value to then", function () {
                File.read(inputFilePath)
                    .then(function (content) {
                        assert(content === "INPUT INPUT");
                    })
            });
        });
    });
    describe("transform", function () {
        it("could as promise chain", function () {
            File.read(inputFilePath)
                .transform(function (content) {
                    return ">>" + content;
                })
                .then(function (content) {
                    assert(content === ">>INPUT INPUT");
                });
        });
    });
    describe("write", function () {
        it("could as promise chain", function () {
            var outputFilePath = fixtureDir + "/output.txt";
            File.read(inputFilePath)
                .transform(function (content) {
                    return ">>" + content;
                })
                .write(outputFilePath)
                .then(function () {
                    assert(fs.existsSync(outputFilePath));
                });
        });
    });
});