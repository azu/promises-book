"use strict";
var getURL = require("../../Ch1_WhatsPromises/src/xhr-promise").getURL;
var request = {
    comment: function getComment() {
        return getURL("http://azu.github.io/promises-book/json/comment.json");
    },
    people: function getPeople() {
        return getURL("http://azu.github.io/promises-book/json/people.json");
    }
};

function main() {
    function recordValue(results, value) {
        results.push(value);
        return results;
    }

    function pushPromise(pushValue, promise) {
        return promise.then(function (value) {
            return pushValue(value);
        });
    }

    var pushValue = recordValue.bind(null, []);
    var favValue = fn.bind(null, pushValue);
    return favValue(request.comment())
        .then(favValue(request.people()));
}

module.exports.main = main;
module.exports.request = request;