"use strict";
// `delay`ミリ秒後にresolveする
function timerPromisefy(delay) {
    return new Promise(function (resolve) {
        setTimeout(function () {
            resolve(delay);
        }, delay);
    });
}
module.exports.timerPromisefy = timerPromisefy;