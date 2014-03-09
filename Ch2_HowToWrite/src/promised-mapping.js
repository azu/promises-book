"use strict";
// 配列の中身をそれぞれpromiseオブジェクトにした配列を返す
function promisedMapping(ary) {
    function timerPromisefy(value) {
        return new Promise(function (resolve) {
            setTimeout(function () {
                resolve(value);// => returnする値
            }, value);
        });
    }
    return ary.map(timerPromisefy);
}
module.exports = promisedMapping;