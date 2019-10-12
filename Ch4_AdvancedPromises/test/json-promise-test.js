"use strict";
const assert = require("power-assert");
const JSONPromise = require("../lib/json-promise").JSONPromise;
describe("json-promise", () => {
    context("When json string", () => {
        it("should return object", () => {
            return shouldFulfilled(JSONPromise("{}")).then((object) => {
                assert(typeof object === "object");
            });
        });
    });
    context("When non-json string", () => {
        it("should rejected", () => {
            return shouldRejected(JSONPromise("this is not json")).catch((error) => {
                assert(error instanceof SyntaxError);
            });
        });
    });
});