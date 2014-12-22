"use strict";
function onReady(fn) {
    var readyState = document.readyState;
    if (readyState === "interactive" || readyState === 'complete') {
        fn();
    } else {
        window.addEventListener("DOMContentLoaded", fn);
    }
}
module.exports.onReady = onReady;