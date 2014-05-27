"use strict";
var getURL = require("../../../Ch1_WhatsPromises/src/xhr-promise").getURL;
var request = {
    comment: function getComment() {
        return getURL('http://azu.github.io/promises-book/json/comment.json').then(JSON.parse);
    },
    people: function getPeople() {
        return getURL('http://azu.github.io/promises-book/json/people.json').then(JSON.parse);
    }
};
function main() {
    var results = [];
    var pushResult = Array.prototype.push.bind(results);
    var promise = [request.comment, request.people].reduce(function (request, next) {
        return request.then(next).then(pushResult);
    }, Promise.resolve());

    return promise.then(function () {
        return results;
    });
}

module.exports.main = main;
module.exports.request = request;