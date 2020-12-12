"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var RuleSpec = /** @class */ (function () {
    function RuleSpec(src) {
        if (!src) {
            throw new Error("src is requried");
        }
        if (!src.from) {
            throw new Error("from is requried");
        }
        if (!src.to) {
            throw new Error("to is requried");
        }
        this.from = src.from;
        this.to = src.to;
    }
    return RuleSpec;
}());
exports.RuleSpec = RuleSpec;
//# sourceMappingURL=ruleSpec.js.map