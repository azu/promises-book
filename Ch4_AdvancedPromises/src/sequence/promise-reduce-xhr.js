"use strict";
var fetchURL = require("../../../Ch1_WhatsPromises/src/xhr-promise").fetchURL;
var request = {
    comment: function getComment() {
        return fetchURL('https://azu.github.io/promises-book/json/comment.json').then(JSON.parse);
    },
    people: function getPeople() {
        return fetchURL('https://azu.github.io/promises-book/json/people.json').then(JSON.parse);
    }
};
function main() {
    function recordValue(results, value) {
        results.push(value);
        return results;
    }

    var pushValue = recordValue.bind(null, []);
    var tasks = [request.comment, request.people];
    return tasks.reduce(function (promise, task) {
        return promise.then(task).then(pushValue);
    }, Promise.resolve());
}

module.exports.main = main;
module.exports.request = request;
