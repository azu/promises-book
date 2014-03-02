"use strict";
function getURL(URL) {
    return new Promise(function (resolve, reject) {
        var req = new XMLHttpRequest();
        req.open('GET', URL);
        req.onload = function () {
            if (req.status == 200) {
                resolve(req.response);
            } else {
                reject(new Error(req.statusText));
            }
        };
        req.onerror = function () {
            reject(new ÏError("Network Error"));
        };
        req.send();
    });
}
module.exports = getURL;