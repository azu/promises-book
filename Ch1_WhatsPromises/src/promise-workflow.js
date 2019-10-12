"use strict";
function asyncFunction() {
    // <1>
    return new Promise(function(resolve) {
        setTimeout(function() {
            resolve("Async Hello world");
        }, 16);
    });
}
// <2>
asyncFunction().then(function(value) {
    console.log(value); // => 'Async Hello world'
}).catch(function(error) {
    console.error(error);
});

module.exports = asyncFunction;
