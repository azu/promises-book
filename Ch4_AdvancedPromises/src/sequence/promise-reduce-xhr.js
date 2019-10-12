"use strict";
const fetchURL = require("../../../Ch1_WhatsPromises/src/xhr-promise").fetchURL;
const request = {
    comment: function fetchComment() {
        return fetchURL("https://azu.github.io/promises-book/json/comment.json").then(JSON.parse);
    },
    people: function fetchPeople() {
        return fetchURL("https://azu.github.io/promises-book/json/people.json").then(JSON.parse);
    }
};
function main() {
    function recordValue(results, value) {
        results.push(value);
        return results;
    }

    const pushValue = recordValue.bind(null, []);
    const tasks = [request.comment, request.people];
    return tasks.reduce((promise, task) => {
        return promise.then(task).then(pushValue);
    }, Promise.resolve());
}

module.exports.main = main;
module.exports.request = request;
