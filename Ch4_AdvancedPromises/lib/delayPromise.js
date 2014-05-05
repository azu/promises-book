"use strict";
function delayPromise(ms) {
    return new Promise(function (resolve) {
        setTimeout(resolve, ms);
    });
}
module.exports.delayPromise = delayPromise;