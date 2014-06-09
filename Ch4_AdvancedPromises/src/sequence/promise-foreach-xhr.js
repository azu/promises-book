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
    function recordValue(results, value) {
        results.push(value);
        return results;
    }

    // [] は記録する初期値を部分適用してる
    var pushValue = recordValue.bind(null, []);
    // promiseオブジェクトを返す関数の配列
    var tasks = [request.comment, request.people];
    var promise = Promise.resolve();// スタート地点
    for (var i = 0; i < tasks.length; i++) {
        var task = tasks[i];
        promise = promise.then(task).then(pushValue);
    }
    return promise;
}

module.exports.main = main;
module.exports.request = request;