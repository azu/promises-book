/**
 * Created by azu on 2014/06/10.
 * LICENSE : MIT
 */
"use strict";
function windowOnload() {
    var consoleUI = require("codemirror-console-ui");
    var codeBlocks = document.querySelectorAll("div.listingblock");
    for (var i = 0; i < codeBlocks.length; i++) {
        var codeBlock = codeBlocks[i];
        var code = codeBlock.getElementsByTagName("code")[0];
        if (code) {
            consoleUI(codeBlock, code.textContent);
        }
    }
}
window.addEventListener("load", windowOnload);