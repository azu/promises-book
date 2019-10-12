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
    return Promise.all([request.comment(), request.people()]);
}

module.exports.main = main;
module.exports.request = request;
