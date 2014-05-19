"use strict";
var done = require("../lib/promise-prototype-done");
var promiseT = Promise.resolve();
promiseT.then(function () {
    JSON.parse("this is not json");
}).catch(function (error) {
    console.error(error);// => "SyntaxError: JSON.parse: unexpected keyword at line 1 column 1 of the JSON data"
});
// vs
var promiseD = Promise.resolve();
promiseD.done(function () {
    JSON.parse('this is not json');
    // => SyntaxError: JSON.parse: unexpected keyword at line 1 column 1 of the JSON data
});
