"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Diff = /** @class */ (function () {
    function Diff(params) {
        this.pattern = params.pattern;
        this.expected = params.expected;
        this.index = params.index;
        this.matches = params.matches;
        this.rule = params.rule;
    }
    Object.defineProperty(Diff.prototype, "tailIndex", {
        get: function () {
            return this.index + this.matches[0].length;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Diff.prototype, "newText", {
        get: function () {
            var _this = this;
            if (this._newText != null) {
                return this._newText;
            }
            if (this.expected == null) {
                return null;
            }
            var result = this.expected.replace(/\$([0-9]{1,2})/g, function (match, g1) {
                var index = parseInt(g1, 10);
                if (index === 0 || (_this.matches.length - 1) < index) {
                    return match;
                }
                return _this.matches[index] || "";
            });
            this._newText = result;
            return this._newText;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Diffの結果を元の文章に反映する
     * @param content 置き換えたいコンテンツ
     * @param delta diffの処理対象の地点がいくつズレているか 複数diffを順次適用する場合に必要
     */
    Diff.prototype.apply = function (content, delta) {
        if (delta === void 0) { delta = 0; }
        if (this.newText == null) {
            return null;
        }
        content = content.slice(0, this.index + delta) + this.newText + content.slice(this.index + delta + this.matches[0].length);
        delta += this.newText.length - this.matches[0].length;
        return {
            replaced: content,
            newDelta: delta,
        };
    };
    Diff.prototype.isEncloser = function (other) {
        return this.index < other.index && other.tailIndex < this.tailIndex;
    };
    Diff.prototype.isCollide = function (other) {
        if (other.index < this.index && this.index < other.tailIndex) {
            return true;
        }
        if (this.index < other.index && other.index < this.tailIndex) {
            return true;
        }
        return false;
    };
    Diff.prototype.isBefore = function (other) {
        return this.index < other.index;
    };
    Diff.prototype.toJSON = function () {
        var _this = this;
        var result = {};
        Object.keys(this).forEach(function (key) {
            if (key[0] === "_") {
                return;
            }
            var value = _this[key];
            if (value instanceof RegExp) {
                result[key] = "/" + value.source + "/" + value.flags;
            }
            else {
                result[key] = value;
            }
        });
        return result;
    };
    return Diff;
}());
exports.Diff = Diff;
//# sourceMappingURL=diff.js.map