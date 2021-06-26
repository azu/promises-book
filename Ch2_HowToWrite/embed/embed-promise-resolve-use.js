function addDelay(value, ms) {
    // promiseオブジェクトを受け取ることを前提とした関数
    function addDelayToPromise(promise, ms) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(promise);
            }, ms);
        });
    }

    return Promise.resolve(value).then((promise) => {
        // `value` は必ずpromiseオブジェクトとなる
        return addDelayToPromise(promise, ms);
    });
}

