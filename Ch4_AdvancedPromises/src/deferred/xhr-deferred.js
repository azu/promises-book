"use strict";
var Deferred = require("./deferred").Deferred;
function getURL(URL) {
    var deferred = new Deferred();
    var req = new XMLHttpRequest();
    req.open('GET', URL, true);
    req.onload = function () {
        if (req.status === 200) {
            deferred.resolve(req.responseText);
        } else {
            deferred.reject(new Error(req.statusText));
        }
    };
    req.onerror = function () {
        deferred.reject(new Error(req.statusText));
    };
    req.send();
    return deferred.promise;
}
module.exports.getURL = getURL;
