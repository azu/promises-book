"use strict";
var promisedMapping = require("./promised-mapping");
var promisedMap = promisedMapping([1, 2, 4, 8, 16, 32]);
var startDate = Date.now();
Promise.all(promisedMap).then(function (values) {
    console.log(Date.now() - startDate + "ms");// 約32ms
    console.log(values); // [1, 2, 4, 8, 16, 32]
});
