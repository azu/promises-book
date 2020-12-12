"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var regexp_1 = require("./utils/regexp");
var targetPattern_1 = require("./targetPattern");
var Target = /** @class */ (function () {
    function Target(src) {
        if (!src) {
            throw new Error("src is requried");
        }
        this.file = regexp_1.parseRegExpString(src.file) || new RegExp(regexp_1.escapeSpecialChars(src.file));
        if (src.includes) {
            this.includes = src.includes.map(function (include) { return new targetPattern_1.TargetPattern(include); });
        }
        else {
            this.includes = [];
        }
        if (src.excludes) {
            this.excludes = src.excludes.map(function (exclude) { return new targetPattern_1.TargetPattern(exclude); });
        }
        else {
            this.excludes = [];
        }
    }
    Target.prototype.reset = function () {
        this.file.lastIndex = 0;
        this.includes.forEach(function (include) { return include.reset(); });
        this.excludes.forEach(function (exclude) { return exclude.reset(); });
    };
    Target.prototype.toJSON = function () {
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
    return Target;
}());
exports.Target = Target;
//# sourceMappingURL=target.js.map