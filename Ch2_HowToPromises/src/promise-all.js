"use strict";
var promisedMapping = require("./promisedMapping");
var promisedMap = promisedMapping([1, 2, 4, 8, 16, 32]);
Promise.all(promisedMap).then(function (values) {
    function sum(values) {
        return values.reduce(function (total, current) {
            return total + current;
        }, 0);
    }

    var totalValue = sum(values);
    console.log(totalValue); // => 1 + 2 + 4 + 8 + 16 + 32
});
