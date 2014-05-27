"use strict";
function sequenceTasks(promises) {
    var results = [];
    var pushResult = Array.prototype.push.bind(results);
    return promises.reduce(function (prevPromise, promisedIdentity) {
        return prevPromise.then(promisedIdentity).then(pushResult);
    }, Promise.resolve()).then(function () {
        return results;
    });
}

module.exports.sequenceTasks = sequenceTasks;