// `delay`ミリ秒後にresolveする
function timerPromisefy(delay) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(delay);
        }, delay);
    });
}
// 一つでもresolve または reject した時点で終了
Promise.race([
    timerPromisefy(1),
    timerPromisefy(32),
    timerPromisefy(64),
    timerPromisefy(128)
]).then((value) => {
    console.log(value); // => 1
});


