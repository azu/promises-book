"use strict";
const assert = require("power-assert");
const fetchURL = require("../src/deferred/xhr-deferred").fetchURL;
const echoServer = require("../../test/echo-server");

describe("#cancelableXHR", () => {
    beforeEach(() => {
        return echoServer.start();
    });
    afterEach(() => {
        return echoServer.stop();
    });
    describe("when get data", () => {
        it("should resolve with value", () => {
            const URL = "http://localhost:3000/?status=200&body=text";
            return shouldFulfilled(fetchURL(URL)).then((value) => {
                assert.equal(value, "text");
            });
        });
    });
    describe("when get fail", () => {
        it("should reject with error", () => {
            const URL = "http://localhost:3000/?status=500";
            return shouldRejected(fetchURL(URL)).catch((error) => {
                assert(error instanceof Error);
            });
        });
    });

});
