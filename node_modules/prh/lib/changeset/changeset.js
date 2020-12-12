"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ChangeSet = /** @class */ (function () {
    function ChangeSet(params) {
        this.filePath = params.filePath;
        this.content = params.content;
        this.diffs = params.diffs;
        this._prepare();
    }
    /* @internal */
    ChangeSet.prototype._prepare = function () {
        var _this = this;
        this.diffs = this.diffs.sort(function (a, b) {
            if (a.index !== b.index) {
                return a.index - b.index;
            }
            return a.tailIndex - b.tailIndex;
        });
        // VSCodeのLSPでworkspace/applyEditを送った時に重複した範囲があるとエラーになる
        // よって、重複する箇所のあるdiffを排除する必要がある
        //   1. 同じindexからスタート→検出文字数が長い方を優先（より複雑なルール
        this.diffs = this.diffs.filter(function (diff, idx) {
            var next = _this.diffs[idx + 1];
            if (!next) {
                return true;
            }
            if (diff.index === next.index && diff.tailIndex < next.tailIndex) {
                return false;
            }
            return true;
        });
        //   2. 異なるindexからスタート→indexが先の方を優先（先勝ち
        this.diffs = this.diffs.filter(function (diff, idx) {
            var prev = _this.diffs[idx - 1];
            if (!prev) {
                return true;
            }
            if (diff.index < prev.tailIndex) {
                return false;
            }
            return true;
        });
    };
    ChangeSet.prototype.concat = function (other) {
        this.diffs = this.diffs.concat(other.diffs);
        this._prepare();
        return this;
    };
    ChangeSet.prototype.applyChangeSets = function (str) {
        this._prepare();
        var delta = 0;
        this.diffs.forEach(function (diff) {
            var applied = diff.apply(str, delta);
            if (applied == null) {
                return;
            }
            str = applied.replaced;
            delta = applied.newDelta;
        });
        return str;
    };
    ChangeSet.prototype.subtract = function (subtrahend) {
        this._prepare();
        subtrahend._prepare();
        var result = new ChangeSet({
            filePath: this.filePath,
            content: this.content,
            diffs: this.diffs.map(function (v) { return v; }),
        });
        var m = 0;
        var s = 0;
        while (true) {
            var minuendDiff = result.diffs[m];
            var subtrahendDiff = subtrahend.diffs[s];
            if (!minuendDiff || !subtrahendDiff) {
                break;
            }
            if (!minuendDiff.isEncloser(subtrahendDiff) && minuendDiff.isCollide(subtrahendDiff)) {
                result.diffs.splice(m, 1);
                continue;
            }
            if (minuendDiff.isBefore(subtrahendDiff)) {
                m++;
            }
            else {
                s++;
            }
        }
        return result;
    };
    ChangeSet.prototype.intersect = function (audit) {
        this._prepare();
        audit._prepare();
        var result = new ChangeSet({
            filePath: this.filePath,
            content: this.content,
            diffs: [],
        });
        var a = 0;
        var b = 0;
        while (true) {
            var baseDiff = this.diffs[a];
            var auditDiff = audit.diffs[b];
            if (!baseDiff || !auditDiff) {
                break;
            }
            if (baseDiff.isCollide(auditDiff) && result.diffs.indexOf(baseDiff) === -1) {
                result.diffs.push(baseDiff);
            }
            if (baseDiff.isBefore(auditDiff)) {
                a++;
            }
            else {
                b++;
            }
        }
        return result;
    };
    return ChangeSet;
}());
exports.ChangeSet = ChangeSet;
//# sourceMappingURL=changeset.js.map