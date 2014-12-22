"use strict";
function onReadyPromise() {
    return new Promise(function (resolve, reject) {
        var readyState = document.readyState;
        if (readyState === "interactive" || readyState === 'complete') {
            resolve();
        } else {
            window.addEventListener("DOMContentLoaded", resolve);
        }
    });
}
module.exports.onReadyPromise = onReadyPromise;