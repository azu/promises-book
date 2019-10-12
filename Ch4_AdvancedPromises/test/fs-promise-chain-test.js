"use strict";
const assert = require("power-assert");
const fs = require("fs-extra");
const File = require("../src/promise-chain/fs-promise-chain");
describe("File-Promised", () => {
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
            it("should reject", (done) => {
                File.read(inputFilePath)
                    .then((content) => {
                        assert(content === "INPUT INPUT");
                        done();
                    }).catch(done);
            });
        });
        context("when found file", () => {
            it("can method chain", () => {
                const file = File.read(inputFilePath);
                assert(file instanceof File);
            });
            it("should passing value to then", (done) => {
                File.read(inputFilePath)
                    .then((content) => {
                        assert(content === "INPUT INPUT");
                        done();
                    }).catch(done);
            });
        });
    });
    describe("transform", () => {
        it("could as promise chain", (done) => {
            File.read(inputFilePath)
                .transform((content) => {
                    return ">>" + content;
                })
                .then((content) => {
                    assert(content === ">>INPUT INPUT");
                    done();
                })
                .catch(done);
        });
    });
    describe("write", () => {
        it("could as promise chain", (done) => {
            const writeFilePath = fixtureDir + "/output.txt";
            File.read(inputFilePath)
                .write(writeFilePath)
                .then(() => {
                    assert(fs.existsSync(writeFilePath));
                    done();
                })
                .catch(done);
        });
    });
});
