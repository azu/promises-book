"use strict";
function Deferred() {
    this.promise = new Promise(function (resolve, reject) {
        this._resolve = resolve;
        this._reject = reject;
    }.bind(this));
}
Deferred.prototype.resolve = function (value) {
    this._resolve(value);
};
Deferred.prototype.reject = function (reason) {
    this._reject(reason);
};
module.exports.Deferred = Deferred;