function ArrayAsPromise(array) {
    this.array = array;
    this.promise = Promise.resolve();
}
ArrayAsPromise.prototype.then = function(onFulfilled, onRejected) {
    this.promise = this.promise.then(onFulfilled, onRejected);
    return this;
};
ArrayAsPromise.prototype["catch"] = function(onRejected) {
    this.promise = this.promise.catch(onRejected);
    return this;
};
Object.getOwnPropertyNames(Array.prototype).forEach((methodName) => {
    // Don't overwrite
    if (typeof ArrayAsPromise[methodName] !== "undefined") {
        return;
    }
    const arrayMethod = Array.prototype[methodName];
    if (typeof  arrayMethod !== "function") {
        return;
    }
    ArrayAsPromise.prototype[methodName] = function() {
        const that = this;
        const args = arguments;
        this.promise = this.promise.then(() => {
            that.array = Array.prototype[methodName].apply(that.array, args);
            return that.array;
        });
        return this;
    };
});


module.exports.array = function newArrayAsPromise(array) {
    return new ArrayAsPromise(array);
};