/**
 * Created by azu on 2014/03/25.
 * LICENSE : MIT
 */
"use strict";
const assert = require("power-assert");
describe("promise-race-other", () => {
    it("should call both promise", (done) => {
        let count = 0;
        const winnerPromise = new Promise((resolve) => {
            setTimeout(() => {
                count++;
                resolve("this is winner");
            }, 4);
        });
        const loserPromise = new Promise((resolve) => {
            setTimeout(() => {
                count++;
                resolve("this is loser");
            }, 64);
        }).then(() => {
            assert(count === [winnerPromise, loserPromise].length);
            done();
        });

        Promise.race([winnerPromise, loserPromise]).then(() => {
            assert(count !== [winnerPromise, loserPromise].length);
        });
    });
});
