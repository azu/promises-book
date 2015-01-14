"use strict";
function getURLCallback(URL, callback) {
    var req = new XMLHttpRequest();
    req.open('GET', URL, true);
    req.onload = function () {
        if (req.status === 200) {
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
// <1> JSONパースを安全に行う
function jsonParse(callback, error, value) {
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
// <2> XHRを叩いてリクエスト
var request = {
    comment: function getComment(callback) {
        return getURLCallback('http://azu.github.io/promises-book/json/comment.json', jsonParse.bind(null, callback));
    },
    people: function getPeople(callback) {
        return getURLCallback('http://azu.github.io/promises-book/json/people.json', jsonParse.bind(null, callback));
    }
};
// <3> 複数のXHRリクエストを行い、全部終わったらcallbackを呼ぶ
function allRequest(requests, callback, results) {
    if (requests.length === 0) {
        return callback(null, results);
    }
    var req = requests.shift();
    req(function (error, value) {
        if (error) {
            callback(error, value);
        } else {
            results.push(value);
            allRequest(requests, callback, results);
        }
    });
}

function main(callback) {
    allRequest([request.comment, request.people], callback, []);
}

module.exports.main = main;
module.exports.request = request;
