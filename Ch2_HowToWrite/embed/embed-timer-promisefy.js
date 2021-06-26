// `delay`ミリ秒後にresolveする
function timerPromisefy(delay) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(delay);
        }, delay);
    });
}

