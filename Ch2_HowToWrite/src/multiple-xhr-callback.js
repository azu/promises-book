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

function parse(callback, error, value) {
    if (error) {
        callback(error, value);
    } else {
        try {
            var result = JSON.parse(value);
            callback(null, result);
        } catch (e) {
            callback(e, value);
        }

    }
}
var request = {
    comment: function getComment(callback) {
        return getURLCallback('http://azu.github.io/promises-book/json/comment.json', parse.bind(null, callback));
    },
    people: function getPeople(callback) {
        return getURLCallback('http://azu.github.io/promises-book/json/people.json', parse.bind(null, callback));
    }
};
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
    var results = [];
    request.comment(function (error, value) {
        if (error) {
            return callback(error, value);
        }
        results.push(value);
        request.people(function (error, value) {
            if (error) {
                return callback(error, value);
            }
            results.push(value);
            callback(null, results);
        });
    });
}