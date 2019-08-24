"use strict";
var fetchURL = require("../../Ch1_WhatsPromises/src/xhr-promise").fetchURL;
var request = {
    comment: function getComment() {
        return fetchURL("https://azu.github.io/promises-book/json/comment.json");
    },
    people: function getPeople() {
        return fetchURL("https://azu.github.io/promises-book/json/people.json");
    }
};

function main() {
    var results = [];
    var pushValue = Array.prototype.push.bind(results);
    var favValue = fn.bind(null, pushValue);
    return favValue(request.comment())
        .then(favValue(request.people()));
}

module.exports.main = main;
module.exports.request = request;
