const { test } = require("@power-doctest/tester");
const { parse } = require("@power-doctest/asciidoctor");
const globby = require("globby");
const fs = require("fs");
const path = require("path");
// = の段落が順番でないため do not support nested sections が発生する問題を回避する
// ダミー文字列に書き換える
const replaceDummyHeader = (content) => {
    return content.split("\n").map(line => {
        return line.replace(/^(=+)/g, (all, match) => {
            return "♪".repeat(match.length);
        });
    }).join("\n");
};
describe("doctest:adoc", () => {
    const projectDir = path.join(__dirname, "..");
    const files = globby.sync([
        `${path.join(projectDir, "Ch5_AsyncFunction")}/**/*.adoc`,
        `!**/node_modules{,/**}`,
    ]);
    files.forEach(filePath => {
        const normalizeFilePath = filePath.replace(projectDir, "");
        describe(`${normalizeFilePath}`, () => {
            const content = fs.readFileSync(filePath, "utf-8");
            const parsedCodes = parse({
                filePath,
                content: replaceDummyHeader(content)
            });
            // try to eval
            const dirName = path.dirname(filePath).split(path.sep).pop();
            parsedCodes.forEach((parsedCode) => {
                const codeValue = parsedCode.code;
                const testCaseName = codeValue.slice(0, 32).replace(/[\r\n]/g, "_");
                it(dirName + ": " + testCaseName, () => {
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
