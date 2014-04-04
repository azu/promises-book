"use strict";
function addDelay(value, ms) {
    // promiseオブジェクトを受け取ることを前提とした関数
    function addDelayToPromise(promise, ms) {
        return new Promise(function (resolve) {
            setTimeout(function () {
                resolve(promise)
            }, ms);
        });
    }

    return Promise.resolve(value).then(function (promise) {
        // `value` は必ずpromiseオブジェクトとなる
        return addDelayToPromise(promise, ms);
    });
}
module.exports.addDelay = addDelay;