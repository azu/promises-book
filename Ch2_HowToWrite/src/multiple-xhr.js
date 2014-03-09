"use strict";
var getURL = require("../../Ch1_WhatsPromises/src/xhr-promise");
function getComment() {
    return getURL("http://azu.github.io/promises-book/json/comment.json");
}
function getPeople() {
    return getURL("http://azu.github.io/promises-book/json/people.json");
}
var results = [];
function recordValue(value) {
    results.push(value);
}
function main(callback) {
    getComment().then(recordValue)
        .then(getPeople)
        .then(recordValue)
        .then(function () {
            callback(results);
        }).catch(function (error) {
            console.log(error);
        });
}

module.exports = main;