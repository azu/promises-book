"use strict";
const Q = require("q");
const FS = require("q-io/fs");
const esprima = require("esprima");
const pather = require("path");
// http://www.regexr.com/38t47
const inlineCodeReg = /\[source.*?javascript\]\n[\s\S]*?----([\s\S]*?)----/gm;
const includeCodeReg = /include::/;
const skipContentPattern = /Syntax Error/;
function trimIncludeCode(code) {
    const replaceRegExp = /include::.*/g;
    const trimedCode = code.replace(replaceRegExp, "");
    return trimedCode.trim();
}
function pickupContent(content) {
    const results = [];
    let matches;
    while ((matches = inlineCodeReg.exec(content)) !== null) {
        const code = matches[1];
        if (includeCodeReg.test(code)) {
            const trimedCode = trimIncludeCode(code);
            if (trimedCode.length > 0) {
                results.push(trimedCode);
            }
        } else {
            results.push(code);
        }
    }
    return results;
}
function parseContents(content, filePath) {
    // skip
    if (skipContentPattern.test(content)) {
        return;
    }
    try {
        esprima.parse(content);
    } catch (error) {
        error.filePath = filePath;
        error.fileContent = content;
        return error;
    }
}

function printResults(results) {
    results.forEach((errors) => {
        errors.forEach((error) => {
            console.error(">> filePath : " + pather.resolve(error.filePath) + "\n"
                    + "----\n" + error.fileContent.trim() + "\n----\n",
            error,
            "\n\n"
            );
        });
    });
}

module.exports.checkInlineScript = function checkInlineScript(rootPath) {
    const asciidocPromises = FS.listTree(rootPath, (filePath, stat) => {
        if (stat.isDirectory()) {
            return false;
        }
        return pather.extname(filePath) === ".adoc";
    });

    return asciidocPromises.then((filePathList) => {
        const promises = filePathList.map((filePath) => {
            return FS.read(filePath)
                .then(pickupContent)
                .then((contents) => {
                    return contents.map((content) => {
                        return parseContents(content, filePath);
                    }).filter((error) => {
                        return error != null && error instanceof Error;
                    });
                });
        });
        return Q.all(promises).then((results) => {
            const filteredResults = results.filter((errors) => {
                return Array.isArray(errors) && errors.length > 0;
            });

            if (filteredResults.length > 0) {
                printResults(filteredResults);
                return Q.reject("Found parse error count :" + filteredResults.length);
            }
        });
    });
};