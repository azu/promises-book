// LICENSE : MIT
"use strict";
function localize(dict, lang) {
    var keys = Object.keys(dict);
    var localizedDict = {};
    keys.forEach(function(key) {
        localizedDict[key] = dict[key][lang];
    });
    return localizedDict;
}
module.exports = localize;
