"use strict";
var cheerio = require('cheerio');
function checkInternalLinks(source) {
    var $ = cheerio.load(source, {
        normalizeWhitespace: false,
        xmlMode: false,
        decodeEntities: true
    });
    var $links = $("a");
    var $internalLinks = $links.filter(function (idx, a) {
        return /^#/.test($(this).attr("href"));
    });

    function escapeSelector(selector) {
        return selector.replace(/([:.])/g, "\\$1");
    }

    function checkLinks($links) {
        var errors = [];
        $links.each(function (idx, a) {
            var hash = $(this).attr("href");
            var source = $(escapeSelector(hash));
            if (source.length === 0) {
                errors.push(new Error("[Error] Not Found:" + hash + " | " + $(this).parent().text()));
            }
            if (source.length > 1) {
                errors.push(new Error("[重複] IDが重複定義されてる" + hash + " | " + $(this).parent().text()));
            }
        });
        return errors;
    }

    return checkLinks($internalLinks);
}
module.exports.checkInternalLinks = checkInternalLinks;
