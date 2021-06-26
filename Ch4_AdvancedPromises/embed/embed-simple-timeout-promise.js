function delayPromise(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
function timeoutPromise(promise, ms) {
    const timeout = delayPromise(ms).then(() => {
        throw new Error("Operation timed out after " + ms + " ms");
    });
    return Promise.race([promise, timeout]);
}

