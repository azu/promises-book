/**
 * Created by azu on 2014/06/11.
 * LICENSE : MIT
 */
"use strict";
var Promise = require("ypromise");
module.exports.initilize = function () {
    var consoleUI = require("codemirror-console-ui");
    consoleUI.setUserContext({
        Promise: Promise
    });
    var codeBlocks = document.querySelectorAll("div.listingblock");
    for (var i = 0; i < codeBlocks.length; i++) {
        var codeBlock = codeBlocks[i];
        var code = codeBlock.getElementsByTagName("code")[0];
        if (code) {
            consoleUI(codeBlock, code.textContent);
        }
    }
}