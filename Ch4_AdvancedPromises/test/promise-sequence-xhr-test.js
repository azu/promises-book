"use strict";
var assert = require("power-assert");
var sinon = require("sinon");
var xhr = require("../src/sequence/promise-sequence-xhr");
describe("promise-sequence-xhr", function () {
    beforeEach(function () {
        var lock = true;
        sinon.stub(xhr.request, "comment", function () {
            return new Promise(function (resolve) {
                setTimeout(function () {
                    lock = false;
                    resolve(1);
                }, 50);
            });
        });
        sinon.stub(xhr.request, "people", function () {
            return new Promise(function (resolve, reject) {
                if (!lock) {
                    resolve(2);
                } else {
                    reject(new Error("promise is locked"))
                }
            });
        });
    });
    afterEach(function (done) {
        xhr.request.comment.restore();
        xhr.request.people.restore();
        done();
    });
    it("should passing result of request callback", function () {
        return shouldFulfilled(xhr.main()).then(function (value) {
            assert.deepEqual(value, [1, 2]);
        })
    });
});