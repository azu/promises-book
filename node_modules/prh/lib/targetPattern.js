"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var regexp_1 = require("./utils/regexp");
var TargetPattern = /** @class */ (function () {
    function TargetPattern(src) {
        if (!src) {
            throw new Error("src is requried");
        }
        if (typeof src === "string") {
            this.pattern = regexp_1.parseRegExpString(src) || new RegExp(regexp_1.escapeSpecialChars(src));
            this.pattern = regexp_1.addDefaultFlags(this.pattern);
            return;
        }
        else {
            if (!src.pattern) {
                throw new Error("pattern is requried");
            }
            this.pattern = regexp_1.parseRegExpString(src.pattern) || regexp_1.addDefaultFlags(new RegExp(regexp_1.escapeSpecialChars(src.pattern)));
            this.pattern = regexp_1.addDefaultFlags(this.pattern);
        }
    }
    TargetPattern.prototype.reset = function () {
        this.pattern.lastIndex = 0;
    };
    TargetPattern.prototype.toJSON = function () {
        var alt = {};
        for (var key in this) {
            if (key.indexOf("_") === 0) {
                continue;
            }
            var value = this[key];
            if (value instanceof RegExp) {
                alt[key] = value.toString();
                continue;
            }
            alt[key] = value;
        }
        return alt;
    };
    return TargetPattern;
}());
exports.TargetPattern = TargetPattern;
//# sourceMappingURL=targetPattern.js.map