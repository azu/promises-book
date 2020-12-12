function shouldRejected(promise) {
    return {
        "catch": function(fn) {
            return promise.then(() => {
                throw new Error("Expected promise to be rejected but it was fulfilled");
            }, (reason) => {
                fn.call(promise, reason);
            }
            );
        }
    };
}
