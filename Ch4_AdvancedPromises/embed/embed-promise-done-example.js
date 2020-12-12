if (typeof Promise.prototype.done === "undefined") {
    Promise.prototype.done = function(onFulfilled, onRejected) {
        this.then(onFulfilled, onRejected).catch((error) => {
            setTimeout(() => {
                throw error;
            }, 0);
        });
    };
}
const promise = Promise.resolve();
promise.done(() => {
    JSON.parse("this is not json");
    // => SyntaxError: JSON.parse
});
