"use strict";
const assert = require("power-assert");
const sinon = require("sinon");
const xhr = require("../src/sequence/promise-reduce-xhr");
describe("promise-reduce-chain", () => {
    beforeEach(() => {
        let lock = true;
        sinon.stub(xhr.request, "comment", () => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    lock = false;
                    resolve(1);
                }, 50);
            });
        });
        sinon.stub(xhr.request, "people", () => {
            return new Promise((resolve, reject) => {
                if (!lock) {
                    resolve(2);
                } else {
                    reject(new Error("promise is locked"));
                }
            });
        });
    });
    afterEach((done) => {
        xhr.request.comment.restore();
        xhr.request.people.restore();
        done();
    });
    it("should passing result of request callback", () => {
        return shouldFulfilled(xhr.main()).then((value) => {
            assert.deepEqual(value, [1, 2]);
        });
    });


});
