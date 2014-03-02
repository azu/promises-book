"use strict";
var Promise = require("ypromise");
function asyncFunction() {
    return new Promise(function (resolve, reject) { // <1>
        setTimeout(function () {
            resolve('Async Hello world');
        }, 16);
    });
}
module.exports = asyncFunction;

asyncFunction() // <2>
    .then(function (value) {
        console.log(value); // => 'Async Hello world'
    }).catch(function (error) {
        console.log(error);
    });
