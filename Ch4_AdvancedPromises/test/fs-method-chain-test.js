"use strict";
const assert = require("power-assert");
const fs = require("fs-extra");
const File = require("../src/promise-chain/fs-method-chain");
File.prototype.then = function(fn) {
    fn.call(this, this.lastValue);
    return this;
};
describe("File", () => {
    const fixtureDir = __dirname + "/__fixtures";
    const inputFilePath = fixtureDir + "/input.txt";
    beforeEach(() => {
        fs.copySync(__dirname + "/fixtures", fixtureDir);
    });
    afterEach(() => {
        fs.removeSync(fixtureDir);
    });
    describe("read", () => {
        context("when not found", () => {
            it("should reject", () => {
                File.read(inputFilePath)
                    .then((content) => {
                        assert(content === "INPUT INPUT");
                    });
            });
        });
        context("when found file", () => {
            it("can method chain", () => {
                const file = File.read(inputFilePath);
                assert(file instanceof File);
            });
            it("should passing value to then", () => {
                File.read(inputFilePath)
                    .then((content) => {
                        assert(content === "INPUT INPUT");
                    });
            });
        });
    });
    describe("transform", () => {
        it("could as promise chain", () => {
            File.read(inputFilePath)
                .transform((content) => {
                    return ">>" + content;
                })
                .then((content) => {
                    assert(content === ">>INPUT INPUT");
                });
        });
    });
    describe("write", () => {
        it("could as promise chain", () => {
            const outputFilePath = fixtureDir + "/output.txt";
            File.read(inputFilePath)
                .transform((content) => {
                    return ">>" + content;
                })
                .write(outputFilePath)
                .then(() => {
                    assert(fs.existsSync(outputFilePath));
                });
        });
    });
});