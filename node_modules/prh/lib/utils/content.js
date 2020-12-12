"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function indexToLineColumn(index, content) {
    if (index < 0 || content[index] == null) {
        throw new Error("unbound index value: " + index);
    }
    var line = 0;
    var prevLfIndex = 0;
    while (true) {
        var lfIndex = content.indexOf("\n", prevLfIndex + 1);
        if (lfIndex === -1 || index <= lfIndex) {
            return {
                line: line,
                column: index - (prevLfIndex === 0 ? 0 : prevLfIndex + 1),
            };
        }
        line++;
        prevLfIndex = lfIndex;
    }
}
exports.indexToLineColumn = indexToLineColumn;
//# sourceMappingURL=content.js.map