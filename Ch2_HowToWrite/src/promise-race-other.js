"use strict";
var winnerPromise = new Promise(function (resolve) {
    setTimeout(function () {
        console.log("this is winner");
        resolve("this is winner");
    }, 4);
});
var loserPromise = new Promise(function (resolve) {
    setTimeout(function () {
        console.log("this is loser");
        resolve("this is loser");
    }, 1000);
});

// 一番最初のものがresolveされた時点で終了
Promise.race([winnerPromise, loserPromise]).then(function (value) {
    console.log(value); // => 'this is winner'
});
