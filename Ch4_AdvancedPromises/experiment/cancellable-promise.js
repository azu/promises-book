/**
 * Created by azu on 2014/05/02.
 * LICENSE : MIT
 */
"use strict";
var CancellablePromise = function (executor) {
    this._canceld = false;
    Promise.call(this, executor);
};
if (typeof Object.setPrototypeOf === "function") {
    Object.setPrototypeOf(CancellablePromise, Promise);
} else {
    CancellablePromise.__proto__ = Promise;
}

CancellablePromise.prototype = Object.create(Promise.prototype, {
    constructor: {
        value: CancellablePromise
    }
});
CancellablePromise.prototype.cancel = function (reason) {
    var targetPromise = this;
    do {
        targetPromise._canceld = true;
        if (targetPromise._callback) {
            targetPromise._callback.call(targetPromise, reason);
        }
    } while (targetPromise = targetPromise._parentPromise);
};

CancellablePromise.prototype.isCanceled = function () {
    return this._canceld;
};
CancellablePromise.prototype.onCancel = function (fn) {
    this._callback = fn;
};
CancellablePromise.prototype.then = function passCatch(onFulfilled, onRejected) {
    var that = this;
    var promise = Promise.prototype.then.call(that, function (value) {
        if (!that.isCanceled()) {
            onFulfilled.call(that, value);
        }
    }, function (reason) {
        if (!that.isCanceled()) {
            onRejected.call(that, reason);
        }
    });
    promise._parentPromise = this;
    return promise;
};
module.exports = CancellablePromise;
