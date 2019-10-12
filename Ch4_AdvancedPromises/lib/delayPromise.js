"use strict";
function delayPromise(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
module.exports.delayPromise = delayPromise;
