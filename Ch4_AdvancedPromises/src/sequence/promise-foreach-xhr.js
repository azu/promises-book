"use strict";
const fetchURL = require("../../../Ch1_WhatsPromises/src/xhr-promise").fetchURL;
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

    // [] は記録する初期値を部分適用してる
    const pushValue = recordValue.bind(null, []);
    // promiseオブジェクトを返す関数の配列
    const tasks = [request.comment, request.people];
    let promise = Promise.resolve();// スタート地点
    for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        promise = promise.then(task).then(pushValue);
    }
    return promise;
}

module.exports.main = main;
module.exports.request = request;
