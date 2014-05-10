"use strict";
var assert = require("power-assert");
var fs = require("fs-extra");
var File = require("../src/promise-chain");
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
            it("should reject", function (done) {
                File.readAsPromise(inputFilePath)
                    .then(function (content) {
                        assert(content === "INPUT INPUT");
                        done();
                    }).catch(done);
            });
        });
        context("when found file", function () {
            it("can method chain", function () {
                var file = File.readAsPromise(inputFilePath);
                assert(file instanceof File);
            });
            it("should passing value to then", function (done) {
                File.readAsPromise(inputFilePath)
                    .then(function (content) {
                        assert(content === "INPUT INPUT");
                        done();
                    }).catch(done);
            });
        });
    });
    describe("transform", function () {
        it("could as promise chain", function (done) {
            File.readAsPromise(inputFilePath)
                .transform(function (content) {
                    return ">>" + content;
                })
                .then(function (content) {
                    assert(content === ">>INPUT INPUT");
                    done();
                })
                .catch(done);
        });
    });
    describe("write", function () {
        it("could as promise chain", function (done) {
            var writeFilePath = fixtureDir + "/output.txt";
            File.readAsPromise(inputFilePath)
                .write(writeFilePath)
                .then(function (content) {
                    assert(fs.existsSync(writeFilePath));
                    done();
                })
                .catch(done);
        });
    });
});