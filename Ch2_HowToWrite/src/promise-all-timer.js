"use strict";
var timerPromisefy = require("../lib/timer-promisefy").timerPromisefy;
var startDate = Date.now();
// 全てがresolveされたら終了
Promise.all([
    timerPromisefy(1),
    timerPromisefy(32),
    timerPromisefy(64),
    timerPromisefy(128)
]).then(function (values) {
    console.log(Date.now() - startDate + "ms");// 約32ms
    console.log(values); // [1, 2, 4, 8, 16, 32]
});
