"use strict";
var assert = require("power-assert");
var sinon = require("sinon");
var xhr = require("../src/multiple-xhr");
describe("multiple-xhr", function () {
    before(function () {
        sinon.stub(xhr.request, "comment").returns(Promise.resolve(1));
        sinon.stub(xhr.request, "people").returns(Promise.resolve(2));
    });
    after(function (done) {
        xhr.request.comment.restore();
        done();
    });
    it("should passing result of request callback", function (done) {
        xhr.main().then(function (value) {
            assert.deepEqual(value, [1, 2]);
            done();
        }).catch(done);
    });
});

