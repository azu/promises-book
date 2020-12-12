// LICENSE : MIT
"use strict";
import { RuleHelper } from "textlint-rule-helper";
/**
 * RegExp#flags polyfill
 */
if (RegExp.prototype.flags === undefined) {
    Object.defineProperty(RegExp.prototype, "flags", {
        configurable: true,
        get: function() {
            return this.toString().match(/[gimuy]*$/)[0];
        }
    });
}

const prh = require("prh");
const path = require("path");
const untildify = require("untildify");

const defaultOptions = {
    checkLink: false,
    checkBlockQuote: false,
    checkEmphasis: false,
    checkHeader: true
};

function createPrhEngine(rulePaths, baseDir) {
    if (rulePaths.length === 0) {
        return null;
    }
    const expandedRulePaths = rulePaths.map(rulePath => untildify(rulePath));
    const prhEngine = prh.fromYAMLFilePath(path.resolve(baseDir, expandedRulePaths[0]));
    expandedRulePaths.slice(1).forEach(ruleFilePath => {
        const config = prh.fromYAMLFilePath(path.resolve(baseDir, ruleFilePath));
        prhEngine.merge(config);
    });
    return prhEngine;
}

function createPrhEngineFromContents(yamlContents) {
    if (yamlContents.length === 0) {
        return null;
    }
    const dummyFilePath = "";
    const prhEngine = prh.fromYAML(dummyFilePath, yamlContents[0]);
    yamlContents.slice(1).forEach(content => {
        const config = prh.fromYAML(dummyFilePath, content);
        prhEngine.merge(config);
    });
    return prhEngine;
}

function mergePrh(...engines) {
    const engines_ = engines.filter(engine => !!engine);
    const mainEngine = engines_[0];
    engines_.slice(1).forEach(engine => {
        mainEngine.merge(engine);
    });
    return mainEngine;
}

const assertOptions = options => {
    if (typeof options.ruleContents === "undefined" && typeof options.rulePaths === "undefined") {
        throw new Error(`textlint-rule-prh require Rule Options.
Please set .textlinrc:
{
    "rules": {
        "prh": {
            "rulePaths" :["path/to/prh.yml"]
        }
    }
}
`);
    }
};

const createIgnoreNodeTypes = (options, Syntax) => {
    const nodeTypes = [];
    if (!options.checkLink) {
        nodeTypes.push(Syntax.Link);
    }
    if (!options.checkBlockQuote) {
        nodeTypes.push(Syntax.BlockQuote);
    }
    if (!options.checkEmphasis) {
        nodeTypes.push(Syntax.Emphasis);
    }
    if (!options.checkHeader) {
        nodeTypes.push(Syntax.Header);
    }
    return nodeTypes;
};

/**
 * for each diff of changeSet
 * @param {ChangeSet} changeSet
 * @param {string} str
 * @param {function({
            matchStartIndex: number,
            matchEndIndex: number,
            actual: string
            expected: string
        })}onChangeOfMatch
 */
const forEachChange = (changeSet, str, onChangeOfMatch) => {
    const sortedDiffs = changeSet.diffs.sort(function(a, b) {
        return a.index - b.index;
    });
    let delta = 0;
    sortedDiffs.forEach(function(diff) {
        const result = diff.expected.replace(/\$([0-9]{1,2})/g, function(match, g1) {
            const index = parseInt(g1);
            if (index === 0 || diff.matches.length - 1 < index) {
                return match;
            }
            return diff.matches[index] || "";
        });
        // matchStartIndex/matchEndIndex value is original position, not replaced position
        // textlint use original position
        const matchStartIndex = diff.index;
        const matchEndIndex = matchStartIndex + diff.matches[0].length;
        // actual => expected
        const actual = str.slice(diff.index + delta, diff.index + delta + diff.matches[0].length);
        const prh = diff.rule.raw.prh || null;
        onChangeOfMatch({
            matchStartIndex,
            matchEndIndex,
            actual: actual,
            expected: result,
            prh
        });
        str = str.slice(0, diff.index + delta) + result + str.slice(diff.index + delta + diff.matches[0].length);
        delta += result.length - diff.matches[0].length;
    });
};
const getConfigBaseDir = context => {
    if (typeof context.getConfigBaseDir === "function") {
        return context.getConfigBaseDir() || process.cwd();
    }
    // Old fallback that use deprecated `config` value
    // https://github.com/textlint/textlint/issues/294
    const textlintRcFilePath = context.config ? context.config.configFile : null;
    // .textlinrc directory
    return textlintRcFilePath ? path.dirname(textlintRcFilePath) : process.cwd();
};

function reporter(context, userOptions = {}) {
    assertOptions(userOptions);
    const options = Object.assign({}, defaultOptions, userOptions);
    // .textlinrc directory
    const textlintRCDir = getConfigBaseDir(context);
    // create prh config
    const rulePaths = options.rulePaths || [];
    const ruleContents = options.ruleContents || [];
    // yaml file + yaml contents
    const prhEngineContent = createPrhEngineFromContents(ruleContents);
    const prhEngineFiles = createPrhEngine(rulePaths, textlintRCDir);
    const prhEngine = mergePrh(prhEngineFiles, prhEngineContent);
    const helper = new RuleHelper(context);
    const { Syntax, getSource, report, fixer, RuleError } = context;
    const ignoreNodeTypes = createIgnoreNodeTypes(options, Syntax);
    return {
        [Syntax.Str](node) {
            if (helper.isChildNode(node, ignoreNodeTypes)) {
                return;
            }
            const text = getSource(node);
            // to get position from index
            // https://github.com/prh/prh/issues/29
            const dummyFilePath = "";
            const makeChangeSet = prhEngine.makeChangeSet(dummyFilePath, text);
            forEachChange(makeChangeSet, text, ({ matchStartIndex, matchEndIndex, actual, expected, prh }) => {
                // If result is not changed, should not report
                if (actual === expected) {
                    return;
                }

                const suffix = prh !== null ? "\n" + prh : "";
                const messages = actual + " => " + expected + suffix;
                report(
                    node,
                    new RuleError(messages, {
                        index: matchStartIndex,
                        fix: fixer.replaceTextRange([matchStartIndex, matchEndIndex], expected)
                    })
                );
            });
        }
    };
}

module.exports = {
    linter: reporter,
    fixer: reporter
};
