"use strict";
function fetchURLCallback(URL, callback) {
    var req = new XMLHttpRequest();
    req.open('GET', URL, true);
    req.onload = function () {
        if (200 <= req.status && req.status < 300) {
            callback(null, req.responseText);
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
    comment: function fetchComment(callback) {
        return fetchURLCallback('https://azu.github.io/promises-book/json/comment.json', parse.bind(null, callback));
    },
    people: function fetchPeople(callback) {
        return fetchURLCallback('https://azu.github.io/promises-book/json/people.json', parse.bind(null, callback));
    }
};
function main(callback) {
    function requester(requests, callback) {
        var results = [];
        var requestLength = results.length;

        function handler(error, value) {
            if (error) {
                return callback(error, value);
            }
            results.push(value);
            if (results.length === requestLength) {
                callback(null, results);
            }
        }

        for (var i = 0; i < requests.length; i++) {
            var req = requests[i];
            req(handler);
        }
    }

    requester([request.comment, request.people], callback);
}

module.exports.main = main;
module.exports.request = request;
