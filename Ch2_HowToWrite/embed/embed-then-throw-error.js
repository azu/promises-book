function throwError(value) { // 例外を投げる
    throw new Error(value);
}
// <1> onRejectedが呼ばれることはない
function badMain(onRejected) {
    return Promise.resolve(42).then(throwError, onRejected);
}
// <2> onRejectedが例外発生時に呼ばれる
function goodMain(onRejected) {
    return Promise.resolve(42).then(throwError).catch(onRejected);
}



