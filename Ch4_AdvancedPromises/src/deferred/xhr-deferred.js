"use strict";
var Deferred = require("./deferred").Deferred;
function fetchURL(URL) {
    var deferred = new Deferred();
    var req = new XMLHttpRequest();
    req.open('GET', URL, true);
    req.onload = function () {
        if (200 <= req.status && req.status < 300) {
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
module.exports.fetchURL = fetchURL;
