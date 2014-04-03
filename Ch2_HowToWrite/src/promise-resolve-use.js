"use strict";
function addDelay(promise, ms) {
    // promiseオブジェクトを受け取ることを前提とした関数
    function addDelayToPromise(promise, ms) {
        return new Promise(function (resolve) {
            setTimeout(function () {
                resolve(promise)
            }, ms);
        });
    }

    return Promise.resolve(promise).then(function (value) {
        // `value` は必ずpromiseオブジェクトとなる
        return addDelayToPromise(value, ms);
    });
}
module.exports.addDelay = addDelay;