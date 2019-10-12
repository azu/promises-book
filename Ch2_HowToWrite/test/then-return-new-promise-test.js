"use strict";
const assert = require("power-assert");
describe("promise.then ", () => {
    it("should return new promise object", () => {
        const aPromise = new Promise((resolve) => {
            resolve(100);
        });
        const thenPromise = aPromise.then((value) => {
            console.log(value);
        });
        const catchPromise = thenPromise.catch((error) => {
            console.error(error);
        });
        assert(aPromise !== thenPromise);
        assert(thenPromise !== catchPromise);
    });
    it("diferrence then then", (done) => {
        const aPromise = new Promise((resolve) => {
            resolve(100);
        });
        aPromise.then((value) => {
            return value * 2;
        });
        aPromise.then((value) => {
            return value * 2;
        });
        aPromise.then((value) => {
            assert(value === 100);
        }).then(done, done);

        const bPromise = new Promise((resolve) => {
            resolve(100);
        });
        bPromise.then((value) => {
            return value * 2;
        }).then((value) => {
            return value * 2;
        }).then((value) => {
            assert(value === 100 * 4);
        });
    });
});
