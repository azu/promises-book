"use strict";
function getURLCallback(URL, callback) {
    var req = new XMLHttpRequest();
    req.open('GET', URL, false);
    req.onload = function () {
        if (req.status == 200) {
            callback(null, req.response);
        } else {
            callback(new Error(req.statusText), req.response);
        }
    };
    req.onerror = function () {
        callback(new Error(req.statusText));
    };
    req.send();
}

function getComment(callback) {
    return getURL('http://azu.github.io/promises-book/json/comment.json', callback);
}
function getPeople(callback) {
    return getURL('http://azu.github.io/promises-book/json/people.json', callback);
}
function compose(fnA, callback, results) {
    var fn = fnA.shift();
    if (typeof fn === "function") {
        fn(function (error, value) {
            compose(fnA, callback, [error, value]);
        });
    } else {
        callback.apply(null, results);
    }
}
function main(callback) {
    compose([getComment, getPeople], callback);
}