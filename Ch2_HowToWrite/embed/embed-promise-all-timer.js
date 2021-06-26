// `delay`ミリ秒後にresolveする
function timerPromisefy(delay) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(delay);
        }, delay);
    });
}
const startDate = Date.now();
// 全てがresolveされたら終了
Promise.all([
    timerPromisefy(1),
    timerPromisefy(32),
    timerPromisefy(64),
    timerPromisefy(128)
]).then((values) => {
    console.log(Date.now() - startDate + "ms");// 約128ms
    console.log(values); // [1,32,64,128]
});
