/**
 * Created by azu on 2014/03/25.
 * LICENSE : MIT
 */
"use strict";
var assert = require("power-assert");
var sinon = require("sinon");
var racer = require("../src/promise-race-other");
describe("promise-race-other", function () {
    it("should call both promise", function (done) {
        var count = 0;
        var winnerPromise = new Promise(function (resolve) {
            setTimeout(function () {
                count++;
                resolve("this is winner");
            }, 4);
        });
        var loserPromise = new Promise(function (resolve) {
            setTimeout(function () {
                count++;
                resolve("this is loser");
            }, 64);
        }).then(function () {
                assert(count === [winnerPromise, loserPromise].length);
                done();
            });

        Promise.race([winnerPromise, loserPromise]).then(function () {
            assert(count === [winnerPromise, loserPromise].length);
        });
    });
});