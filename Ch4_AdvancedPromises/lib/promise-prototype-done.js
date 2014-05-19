"use strict";
if (typeof Promise.prototype.done === "undefined") {
    Promise.prototype.done = function (onFulfilled, onRejected) {
        this.then(onFulfilled, onRejected).catch(function (err) {
            setTimeout(function () {
                throw err;
            }, 0);
        });
    };
}