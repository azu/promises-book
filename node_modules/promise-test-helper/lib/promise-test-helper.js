"use strict";
function isPromise(obj) {
    return obj && typeof obj.then === 'function';
}

function shouldFulfilled(promise) {
    if (!isPromise(promise)) {
        throw new Error("This is not promise object: " + promise);
    }
    return {
        // when promise is rejected, throw error
        "then": function (fn) {
            return promise.then(function (value) {
                    fn.call(promise, value);
                }, function (reason) {
                    return new promise.constructor(function (resolve, reject) {
                        reject(reason);
                    });
                }
            );
        },
        "catch": function () {
            throw new Error("Expected promise to be fulfilled so you should use `shouldFulfilled(promise).then`");
        }
    };
}
function shouldRejected(promise) {
    if (!isPromise(promise)) {
        throw new Error("This is not promise object: " + promise);
    }
    return {
        "then": function (resolve, reject) {
            // e.g.) shouldRejected(promise).then(fn); => should throw error
            if (typeof reject === "undefined") {
                throw new Error("Expected promise to be rejected so you should use `shouldRejected(promise).catch`");
            }
            // simulate: promise.then(mocha.reject, mocha.resolve(done));
            // if promise is rejected then should pass the test.
            promise.then(reject, resolve);
        },
        // when promise is fulfilled, throw error
        "catch": function (fn) {
            return promise.then(function (value) {
                    return new promise.constructor(function (resolve, reject) {
                        if (typeof value === "undefined") {
                            reject(new Error('Expected promise to be rejected but it was fulfilled'));
                        } else {
                            reject(new Error('Expected promise to be rejected but it was fulfilled: ' + value));
                        }
                    });
                }, function (reason) {
                    fn.call(promise, reason);
                }
            );
        }
    };
}
module.exports.shouldFulfilled = shouldFulfilled;
module.exports.shouldRejected = shouldRejected;