// LICENSE : MIT
"use strict";
import ObjectAssign from "object-assign";
export const ParserTypes = {
    // https://github.com/babel/babel/tree/master/packages/babylon aka. using by Babel
    Babylon: "Babylon",
    Esprima: "Esprima",
    Unknown: "Unknown"
};

function isBabylon(dependecies) {
    if (!dependecies) {
        return false;
    }
    var keys = Object.keys(dependecies);
    var matchName = /^babel|^babylon/i;
    return keys.some(function(key) {
        return matchName.test(key);
    });
}

export function findParserType(options) {
    // default parser: esprima
    if (options.parserType) {
        return options.parserType;
    } else {
        return ParserTypes.Esprima;
    }
}
