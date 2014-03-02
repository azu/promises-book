"use strict";
function asyncFunction() {
    return new Promise(function (resolve, reject) { // <1>
        setTimeout(function () {
            resolve('Async Hello world');
        }, 16);
    });
}
asyncFunction() // <2>
    .then(function (value) {
        console.log(value); // => 'Async Hello world'
    }).catch(function (error) {
        console.log(error);
    });

module.exports = asyncFunction;
