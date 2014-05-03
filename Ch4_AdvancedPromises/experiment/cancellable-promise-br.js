/**
 * Created by azu on 2014/05/02.
 * LICENSE : MIT
 */
"use strict";
var CancellablePromise = function (executor) {
    this.canceled = false;
    if (typeof executor === "undefined") {
        this.internalPromise = Promise.resolve();
    } else {
        this.internalPromise = new Promise(executor);
    }
};
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
CancellablePromise.prototype["catch"] = function (onRejected) {
    return this.then(null, onRejected);
};
CancellablePromise.prototype.then = function (onFulfilled, onRejected) {
    var that = this;
    var cPromise = new CancellablePromise();
    cPromise.internalPromise = this.internalPromise.then(function (value) {
        if (!that.isCanceled()) {
            return onFulfilled.call(that.internalPromise, value);
        }
    }, function (reason) {
        if (!that.isCanceled()) {
            return onRejected.call(that.internalPromise, reason);
        }
    });
    cPromise._parentPromise = this;
    return cPromise;
};
//module.exports = CancellablePromise;
/* delegate */
var promise = new CancellablePromise(function (resolve) {
    setTimeout(function () {
        resolve("start");
    }, 100)
});
var promise_2 = promise.then(function (value) {
    console.log("1");
    return "new Value";
}).then(function (value) {
    console.log(value);
}).catch(function (error) {
    console.error(error);
});
promise.onCancel(function (reason) {
    console.log(reason);
});
promise_2.onCancel(function (reason) {
    console.log(reason);
});
console.log(promise_2);
promise_2.cancel("test cancel");