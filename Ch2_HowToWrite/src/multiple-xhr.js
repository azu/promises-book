"use strict";
const fetchURL = require("../../Ch1_WhatsPromises/src/xhr-promise").fetchURL;
const request = {
    comment() {
        return fetchURL("https://azu.github.io/promises-book/json/comment.json").then(JSON.parse);
    },
    people() {
        return fetchURL("https://azu.github.io/promises-book/json/people.json").then(JSON.parse);
    }
};
function main() {
    function recordValue(results, value) {
        results.push(value);
        return results;
    }
    // [] は記録する初期値を部分適用している
    const pushValue = recordValue.bind(null, []);
    return request.comment()
        .then(pushValue)
        .then(request.people)
        .then(pushValue);
}

module.exports.main = main;
module.exports.request = request;
