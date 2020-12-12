const fs = require("fs");
function File() {
    this.promise = Promise.resolve();
}
// Static method for File.prototype.read
File.read = function(filePath) {
    const file = new File();
    return file.read(filePath);
};

File.prototype.then = function(onFulfilled, onRejected) {
    this.promise = this.promise.then(onFulfilled, onRejected);
    return this;
};
File.prototype["catch"] = function(onRejected) {
    this.promise = this.promise.catch(onRejected);
    return this;
};
File.prototype.read = function(filePath) {
    return this.then(() => {
        return fs.readFileSync(filePath, "utf-8");
    });
};
File.prototype.transform = function(fn) {
    return this.then(fn);
};
File.prototype.write = function(filePath) {
    return this.then((data) => {
        return fs.writeFileSync(filePath, data);
    });
};

