"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var regexp_1 = require("./utils/regexp");
var options_1 = require("./options");
var ruleSpec_1 = require("./ruleSpec");
var diff_1 = require("./changeset/diff");
var changeset_1 = require("./changeset");
var Rule = /** @class */ (function () {
    function Rule(src) {
        if (!src) {
            throw new Error("src is requried");
        }
        var rawRule;
        if (typeof src === "string") {
            rawRule = {
                expected: src,
            };
        }
        else {
            rawRule = src;
        }
        function checkEmptyPattern(patterns) {
            if (patterns === "") {
                throw new Error("pattern can't be empty");
            }
            Array.isArray(patterns) && patterns.forEach(function (pattern) {
                if (pattern === "") {
                    throw new Error("patterns can't be empty");
                }
            });
        }
        checkEmptyPattern(rawRule.pattern);
        checkEmptyPattern(rawRule.patterns);
        this.options = new options_1.Options(this, rawRule.options);
        this.expected = rawRule.expected;
        if (this.expected == null) {
            throw new Error("expected is required");
        }
        this.pattern = this._patternToRegExp(rawRule.pattern || rawRule.patterns);
        if (this.pattern == null) {
            throw new Error("pattern is required");
        }
        this.regexpMustEmpty = rawRule.regexpMustEmpty;
        // for JSON order
        var options = this.options;
        delete this.options;
        this.options = options;
        this.specs = (rawRule.specs || []).map(function (spec) { return new ruleSpec_1.RuleSpec(spec); });
        this.raw = rawRule;
        this.check();
    }
    /* @internal */
    Rule.prototype._patternToRegExp = function (pattern) {
        var _this = this;
        if (pattern === "") {
            throw new Error("pattern can't be empty");
        }
        else if (pattern == null) {
            var result = regexp_1.spreadAlphaNum(this.expected);
            if (this.options.wordBoundary) {
                result = regexp_1.addBoundary(result);
            }
            return regexp_1.addDefaultFlags(result);
        }
        else if (typeof pattern === "string") {
            var result = regexp_1.parseRegExpString(pattern);
            if (!result) {
                result = new RegExp(regexp_1.escapeSpecialChars(pattern));
            }
            if (this.options.wordBoundary) {
                result = regexp_1.addBoundary(result);
            }
            return regexp_1.addDefaultFlags(result);
        }
        else if (pattern instanceof Array) {
            var result = regexp_1.combine(pattern.map(function (p) { return _this._patternToRegExp(p); }));
            return regexp_1.addDefaultFlags(result);
        }
        else {
            throw new Error("unexpected pattern: " + pattern);
        }
    };
    /* @internal */
    Rule.prototype._shouldIgnore = function (ignoreRule) {
        // NOTE 考え方：--rules-yaml で表示されるpattern or expectedで指定する
        // patternは配列で指定できて、そのうちの1つのパターンが指定された時に
        // そのルール全体が無視されるのか該当の1パターンだけ無視されるのか予想できないため
        if (ignoreRule.pattern != null && this.pattern.toString() === ignoreRule.pattern) {
            return true;
        }
        if (ignoreRule.expected != null && ignoreRule.expected === this.expected) {
            return true;
        }
        return false;
    };
    Rule.prototype.reset = function () {
        this.pattern.lastIndex = 0;
    };
    Rule.prototype.check = function () {
        var _this = this;
        this.specs.forEach(function (spec) {
            var diffs = _this.applyRule(spec.from);
            var changeSet = new changeset_1.ChangeSet({ content: spec.from, diffs: diffs });
            var result = changeSet.applyChangeSets(spec.from);
            if (spec.to !== result) {
                throw new Error(_this.expected + " spec failed. \"" + spec.from + "\", expected \"" + spec.to + "\", but got \"" + result + "\", " + _this.pattern);
            }
        });
    };
    Rule.prototype.applyRule = function (content) {
        var _this = this;
        this.reset();
        var resultList = regexp_1.collectAll(this.pattern, content);
        return resultList
            .map(function (matches) {
            // JavaScriptでの正規表現では /(?<!記|大)事/ のような書き方ができない
            // /(記|大)事/ で regexpMustEmpty $1 の場合、第一グループが空じゃないとマッチしない、というルールにして回避
            if (_this.regexpMustEmpty) {
                var match = /^\$([0-9]+)$/.exec(_this.regexpMustEmpty);
                if (match == null) {
                    throw new Error(_this.expected + " target failed. please use $1 format.");
                }
                var index = parseInt(match[1], 10);
                if (matches[index]) {
                    return null;
                }
            }
            // 検出したものと期待するものが一致している場合無視させる
            if (_this.expected === matches[0]) {
                return null;
            }
            return new diff_1.Diff({
                pattern: _this.pattern,
                expected: _this.expected,
                index: matches.index,
                matches: matches,
                rule: _this,
            });
        })
            .filter(function (v) { return !!v; }); // (Diff | null)[] を Diff[] に変換したい
    };
    Rule.prototype.toJSON = function () {
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
    return Rule;
}());
exports.Rule = Rule;
//# sourceMappingURL=rule.js.map