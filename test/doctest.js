const { test } = require("@power-doctest/tester");
const { parse } = require("@power-doctest/asciidoctor");
const globby = require("globby");
const fs = require("fs");
const path = require("path");
const transform = (code) => {
    return code; // you need pre transform for the code if needed.
};
// = の段落が順番でないため do not support nested sections が発生する問題を回避する
// ダミー文字列に書き換える
const replaceDummyHeader = (content) => {
    return content.split("\n").map(line => {
        return line.replace(/^(=+)/g, (all, match) => {
            return "♪".repeat(match.length);
        });
    }).join("\n");
};
// doctest for source/**/*.md
describe("doctest:adoc", function () {
    const sourceDir = path.join(__dirname, "..", "Ch5_AsyncFunction");
    const files = globby.sync([
        `${sourceDir}/**/*.adoc`,
        `!**/node_modules{,/**}`,
    ]);
    files.forEach(filePath => {
        const normalizeFilePath = filePath.replace(sourceDir, "");
        describe(`${normalizeFilePath}`, function () {
            const content = fs.readFileSync(filePath, "utf-8");
            let content1 = replaceDummyHeader(content);
            console.log(content1);
            const parsedCodes = parse({
                filePath,
                content: content1
            });
            console.log("parsedCodes", parsedCodes);
            // try to eval
            const dirName = path.dirname(filePath).split(path.sep).pop();
            parsedCodes.forEach((parsedCode, index) => {
                const codeValue = parsedCode.code;
                const testCaseName = codeValue.slice(0, 32).replace(/[\r\n]/g, "_");
                it(dirName + ": " + testCaseName, function () {
                    return test(parsedCode).catch(error => {
                        const filePathLineColumn = `${error.fileName}:${error.lineNumber}:${error.columnNumber}`;
                        console.error(`Asciidoc Doctest is failed
  at ${filePathLineColumn}

----------
${codeValue}
----------
`);
                        return Promise.reject(error);
                    });
                });
            });
        });
    });
});
