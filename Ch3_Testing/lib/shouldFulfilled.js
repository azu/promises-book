"use strict";
function shouldFulfilled(promise) {
    return {
        "then": function (fn) {
            return promise.then(function (value) {
                    fn.call(promise, value);
                }, function (reason) {
                    throw reason;
                }
            );
        }
    };
}
module.exports.shouldFulfilled = shouldFulfilled;