"use strict";
const cheerio = require("cheerio");
function checkInternalLinks(source) {
    const $ = cheerio.load(source, {
        normalizeWhitespace: false,
        xmlMode: false,
        decodeEntities: true
    });
    const $links = $("a");
    const $internalLinks = $links.filter(function(idx, a) {
        return /^#/.test($(this).attr("href"));
    });

    function escapeSelector(selector) {
        return selector.replace(/([:.])/g, "\\$1");
    }

    function checkLinks($links) {
        const errors = [];
        $links.each(function(idx, a) {
            const hash = $(this).attr("href");
            const source = $(escapeSelector(hash));
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
