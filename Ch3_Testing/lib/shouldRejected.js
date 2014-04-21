"use strict";
function shouldRejected(promise) {
    return {
        "catch": function (fn) {
            return promise.then(function () {
                    throw new Error("Expected promise to be rejected but it was fulfilled");
                }, function (reason) {
                    fn.call(promise, reason);
                }
            );
        }
    };
}
module.exports.shouldRejected = shouldRejected;