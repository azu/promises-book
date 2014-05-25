"use strict";
function JSONPromise(value) {
    return new Promise(function (resolve) {
        resolve(JSON.parse(value));
    });
}
module.exports.JSONPromise = JSONPromise;