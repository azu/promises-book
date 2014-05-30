/**
 * Created by azu on 2014/03/16.
 * LICENSE : MIT
 */
"use strict";
var assert = require("power-assert");
var sinon = require("sinon");
var xhr = require("../src/promise-all-xhr");
describe("promise-all-xhr", function () {
    beforeEach(function () {
        sinon.stub(xhr.request, "comment").returns(Promise.resolve(1));
        sinon.stub(xhr.request, "people").returns(Promise.resolve(2));
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

