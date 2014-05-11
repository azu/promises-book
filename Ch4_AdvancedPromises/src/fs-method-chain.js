"use strict";
var fs = require("fs");
function File() {
    this.lastValue = null;
}
// Static method for File.prototype.read
File.read = function FileRead(filePath) {
    var file = new File();
    return file.read(filePath);
};
File.prototype.read = function (filePath) {
    this.lastValue = fs.readFileSync(filePath, "utf-8");
    return this;
};
File.prototype.transform = function (fn) {
    this.lastValue = fn.call(this, this.lastValue);
    return this;
};
File.prototype.write = function (filePath) {
    this.lastValue = fs.writeFileSync(filePath, this.lastValue);
    return this;
};
module.exports = File;
