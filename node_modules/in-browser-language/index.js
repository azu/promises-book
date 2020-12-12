"use strict";

var uniq = require('uniq'),
    navigator = window.navigator || window.clientInformation || {};

var list = function list () {
    var languages = [].concat(
        navigator.languages,
        navigator.language,
        navigator.userLanguage,
        navigator.browserLanguage,
        navigator.systemLanguage
    ).filter(function (language) {
        return language;
    }).map(function (language) {
        return language.replace(/-.*/,'').toLowerCase();
    });

    return uniq(languages, null, true);
};

var first = function first () {
    var languages = list();

    return languages.length ? languages[0] : null;
};

var pick = function pick (proposedLanguages, defaultLanguage) {
    var languages = list(),
        result = null,
        i;

    defaultLanguage = defaultLanguage || null;

    for (i = 0; i < languages.length && result === null; i++) {
        if (proposedLanguages.indexOf(languages[i]) !== -1) {
            result = languages[i];
        }
    }

    if(result === null) {
        result = defaultLanguage;
    }

    return result;
};

module.exports = {
    first : first,
    list : list,
    pick : pick
};
