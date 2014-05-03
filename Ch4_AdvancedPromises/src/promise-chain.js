/**
 * Created by azu on 2014/04/23.
 * LICENSE : MIT
 */
"use strict";

var Room = function (name) {
    this.name = name;
    this.promise = Promise.resolve();
    this.lastResult = null;
    this.state = "close";// open || waiting || close

};
Room.prototype.runAsPromised = function (fn, arg) {
    var that = this;
    return this.promise.then(function (value) {
        that.lastResult = fn.call(that, arg)
    });
};
Room.prototype.open = function () {
    var that = this;
    this.promise = this.promise.then(function () {
        return new Promise(function (resolve, reject) {
            if (that.state === "wating") {
                return reject(that.state);
            }
            that.state = "wating";
            setTimeout(function () {
                that.state = "open";
                console.log(that.state);
                resolve(that.state);
            }, 100);
        });
    });
    return this;
};
Room.prototype.await = function (ms) {
    this.promise = this.promise.then(function () {
        return new Promise(function (resolve) {
            setTimeout(resolve, ms);
        });
    });
    return this;
};
Room.prototype.close = function () {
    var that = this;
    this.promise = this.promise.then(function () {
        return new Promise(function (resolve, reject) {
            if (that.state === "wating") {
                return reject(that.state);
            }
            setTimeout(function () {
                that.state = "close";
                console.log(that.state);
                resolve(that.state);
            }, 100);
        });
    });
    return this;
};
Room.prototype.toSource = function () {
    return this.lastResult;
};

module.exports.Room = Room;
