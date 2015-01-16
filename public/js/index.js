/**
 * Created by azu on 2014/06/10.
 * LICENSE : MIT
 */
"use strict";
function windowOnload() {
    require("./console-editor").initialize();
    require("./sync-toc").initialize();
    require("./bug-report").initialize();
}
var readyState = document.readyState;
if (readyState === "interactive" || readyState === 'complete') {
    windowOnload();
} else {
    window.addEventListener("DOMContentLoaded", windowOnload);
}