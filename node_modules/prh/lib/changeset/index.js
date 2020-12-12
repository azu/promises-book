"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var regexp_1 = require("../utils/regexp");
var diff_1 = require("./diff");
exports.Diff = diff_1.Diff;
var changeset_1 = require("./changeset");
exports.ChangeSet = changeset_1.ChangeSet;
function makeChangeSet(filePath, content, pattern, expected) {
    pattern.lastIndex = 0;
    var resultList = regexp_1.collectAll(pattern, content);
    var diffs = resultList.map(function (matches) { return new diff_1.Diff({ pattern: pattern, expected: expected, index: matches.index, matches: matches }); });
    return new changeset_1.ChangeSet({ filePath: filePath, content: content, diffs: diffs });
}
exports.makeChangeSet = makeChangeSet;
//# sourceMappingURL=index.js.map