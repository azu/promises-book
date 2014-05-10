"use strict";
var fs = require("fs");
function File() {
    this.lastValue = null;
}
File.prototype.read = function (filePath) {
    this.lastValue = fs.readFileSync(filePath, "utf-8");
    return this;
};
File.prototype.transform = function (fn) {
    fn.call(this, this.lastValue);
    return this;
};
File.prototype.write = function (filePath) {
    fs.writeFileSync(filePath, this.lastValue);
    return this;
};
module.exports = File;