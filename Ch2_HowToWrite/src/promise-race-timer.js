"use strict";
var timerPromisefy = require("../lib/timer-promisefy").timerPromisefy;
// 一つでもresolve または reject した時点で終了
Promise.race([
    timerPromisefy(1),
    timerPromisefy(32),
    timerPromisefy(64),
    timerPromisefy(128)
]).then(function (value) {
    console.log(value); // => 1
});


