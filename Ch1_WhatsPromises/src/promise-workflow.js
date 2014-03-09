"use strict";
function asyncFunction() {
    // <1>
    return new Promise(function (resolve, reject) {
        setTimeout(function () {
            resolve('Async Hello world');
        }, 16);
    });
}
// <2>
asyncFunction().then(function (value) {
    console.log(value); // => 'Async Hello world'
}).catch(function (error) {
    console.log(error);
});

module.exports = asyncFunction;
