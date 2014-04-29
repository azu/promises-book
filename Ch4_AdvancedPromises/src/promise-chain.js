/**
 * Created by azu on 2014/04/23.
 * LICENSE : MIT
 */
"use strict";

var Room = function (name) {
    this.name = name;
    this.promise = Promise.resolve();
    this.lastResult = null;
};
Room.prototype.runAsPromised = function (fn, arg) {
    var that = this;
    return this.promise.then(function (value) {
        that.lastResult = fn.call(that, arg)
    });
};
Room.prototype.open = function () {
    this.promise = this.runAsPromised(function (value) {
        console.log(this.name + "is opened");
        return "value";
    });
    return this;
};
Room.prototype.isLocked = function () {

};

Room.prototype.close = function () {

};
Room.prototype.toSource = function () {
    return this.lastResult;
};

module.exports.Room = Room;
