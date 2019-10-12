"use strict";
const Deferred = require("./deferred").Deferred;
function fetchURL(URL) {
    const deferred = new Deferred();
    const req = new XMLHttpRequest();
    req.open("GET", URL, true);
    req.onload = () => {
        if (200 <= req.status && req.status < 300) {
            deferred.resolve(req.responseText);
        } else {
            deferred.reject(new Error(req.statusText));
        }
    };
    req.onerror = () => {
        deferred.reject(new Error(req.statusText));
    };
    req.send();
    return deferred.promise;
}
module.exports.fetchURL = fetchURL;
