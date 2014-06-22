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
    console.log(Date.now() - startDate + "ms");// 約128ms
    console.log(values); // [1,32,64,128]
});
