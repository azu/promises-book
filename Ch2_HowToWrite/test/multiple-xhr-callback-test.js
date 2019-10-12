"use strict";
const assert = require("power-assert");
const sinon = require("sinon");
const xhr = require("../src/multiple-xhr-callback");
describe("multiple-xhr-callback", () => {
    beforeEach(() => {
        sinon.stub(xhr.request, "comment", (callback) => {
            callback(null, 1);
        });
        sinon.stub(xhr.request, "people", (callback) => {
            callback(null, 2);
        });
    });
    afterEach((done) => {
        xhr.request.comment.restore();
        xhr.request.people.restore();
        done();
    });
    it("should passing result of request callback", (done) => {
        xhr.main((error, value) => {
            assert.deepEqual(value, [1, 2]);
            done();
        });
    });
});

