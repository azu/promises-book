const { Transform } = require("stream");
const reg = /require\(["']power-assert["']\)/g;

function modifier(str) {
    // power-assert -> assert
    // strict use strict
    return str.replace(reg, "require(\"assert\")").replace(/["']use strict["'];?\n/g, "");
}

function modify() {
    return new Transform({
        objectMode: true,
        transform(file, encoding, callback) {
            const content = modifier(String(file.contents));
            file.contents = Buffer.from(content);
            this.push(file);
            callback();
        }
    });
}

module.exports = modify;
