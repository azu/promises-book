/**
 * Created by azu on 2014/06/10.
 * LICENSE : MIT
 */
"use strict";
window.onload = function () {
    var CodeBlock = require("./interactive-editor");
    var code = new CodeBlock(document.querySelector("#content > div:nth-child(4) > div > div:nth-child(2) > div:nth-child(4) > div:nth-child(7) > div.content"));
}
