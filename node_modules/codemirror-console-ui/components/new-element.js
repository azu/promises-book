// LICENSE : MIT
"use strict";
var domify = require("domify");
var format = require("@azu/format-text");
function newElement(html, vars) {
    if (arguments.length == 1) return domify(html);
    return domify(format(html, vars));
}
module.exports = newElement;
