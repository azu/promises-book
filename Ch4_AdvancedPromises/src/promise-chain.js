"use strict";
var fs = require("fs");
function File() {
    this.promise = Promise.resolve();
}
File.prototype.then = function (fn) {
    var that = this;
    this.promise = this.promise.then(function (value) {
        return fn.call(that, value)
    });
    return this;
};
File.prototype["catch"] = function (onRejected) {
    this.promise = this.promise.catch(onRejected);
    return this;
};
File.prototype.read = function (filePath) {
    return this.then(function () {
        return fs.readFileSync(filePath, "utf-8");
    });
};
File.prototype.transform = function (fn) {
    return this.then(fn);
};
File.prototype.write = function (filePath) {
    return this.then(function (data) {
        return fs.writeFileSync(filePath, data)
    });
};
module.exports = File;
module.exports.readAsPromise = function (filePath) {
    var file = new File();
    return file.read(filePath);
};
