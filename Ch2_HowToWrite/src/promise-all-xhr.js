"use strict";
var fetchURL = require("../../Ch1_WhatsPromises/src/xhr-promise").fetchURL;
var request = {
    comment: function getComment() {
        return fetchURL('https://azu.github.io/promises-book/json/comment.json').then(JSON.parse);
    },
    people: function getPeople() {
        return fetchURL('https://azu.github.io/promises-book/json/people.json').then(JSON.parse);
    }
};
function main() {
    return Promise.all([request.comment(), request.people()]);
}

module.exports.main = main;
module.exports.request = request;
