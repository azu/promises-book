"use strict";
var promisedMapping = require("./promisedMapping");
var promisedMap = promisedMapping([1, 32, 64, 128]);
// 一番最初のものがresolveされた時点で終了
Promise.race(promisedMap).then(function (value) {
    console.log(value); // => 1
});


