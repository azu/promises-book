/**
 * Created by azu on 2014/06/10.
 * LICENSE : MIT
 */
"use strict";
function windowOnload() {
    require("./console-editor").initilize();
    require("./sync-toc").initilize();
    require("./bug-report").initilize();
}
window.addEventListener("DOMContentLoaded", windowOnload);