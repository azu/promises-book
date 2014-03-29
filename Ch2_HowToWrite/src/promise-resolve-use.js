"use strict";
function addDelay(promise, ms) {
    // `Promise.resolve(promise)`で引数がpromiseオブジェクトであることを保証する
    return Promise.resolve(promise).then(function (value) {
        new Promise(function (resolve) {
            setTimeout(function () {
                resolve(value)
            }, ms);
        });
    });
}
module.exports.addDelay = addDelay;