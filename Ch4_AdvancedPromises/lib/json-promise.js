"use strict";
function JSONPromise(value) {
    return new Promise((resolve) => {
        resolve(JSON.parse(value));
    });
}
module.exports.JSONPromise = JSONPromise;
