"use strict";
// `delay`ミリ秒後にresolveされるpromiseを返す
function timerPromisefy(delay) {
    return new Promise(function (resolve) {
        setTimeout(function () {
            resolve(delay);
        }, delay);
    });
}
module.exports.timerPromisefy = timerPromisefy;