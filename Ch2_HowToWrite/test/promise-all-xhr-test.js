/**
 * Created by azu on 2014/03/16.
 * LICENSE : MIT
 */
"use strict";
const assert = require("power-assert");
const sinon = require("sinon");
const xhr = require("../src/promise-all-xhr");
describe("promise-all-xhr", () => {
    beforeEach(() => {
        sinon.stub(xhr.request, "comment").returns(Promise.resolve(1));
        sinon.stub(xhr.request, "people").returns(Promise.resolve(2));
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

