"use strict";
function onReady(fn) {
    var readyState = document.readyState;
    if (readyState === "interactive" || readyState === 'complete') {
        setTimeout(fn, 0);
    } else {
        window.addEventListener("DOMContentLoaded", fn);
    }
}
module.exports.onReady = onReady;