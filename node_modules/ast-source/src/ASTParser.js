// LICENSE : MIT
"use strict";
import { ParserTypes, findParserType } from "./utils/find-parser";

import { parseToEsprima } from "./babel-parse-to-esprima";
// FIXME: why wrong import for espower-babel?
const esprima = require("esprima");

var debug = require("debug")("ASTSource");

function attachComments(ast, comments, tokens) {
    if (comments.length) {
        var firstComment = comments[0];
        var lastComment = comments[comments.length - 1];
        // fixup program start
        if (!tokens.length) {
            // if no tokens, the program starts at the end of the last comment
            ast.start = lastComment.end;
            ast.loc.start.line = lastComment.loc.end.line;
            ast.loc.start.column = lastComment.loc.end.column;
        } else if (firstComment.start < tokens[0].start) {
            // if there are comments before the first token, the program starts at the first token
            var token = tokens[0];
            ast.start = token.start;
            ast.loc.start.line = token.loc.start.line;
            ast.loc.start.column = token.loc.start.column;

            // estraverse do not put leading comments on first node when the comment
            // appear before the first token
            if (ast.body.length) {
                var node = ast.body[0];
                node.leadingComments = [];
                var firstTokenStart = token.start;
                var len = comments.length;
                for (var i = 0; i < len && comments[i].start < firstTokenStart; i++) {
                    node.leadingComments.push(comments[i]);
                }
            }
        }
        // fixup program end
        if (tokens.length) {
            var lastToken = tokens[tokens.length - 1];
            if (lastComment.end > lastToken.end) {
                // If there is a comment after the last token, the program ends at the
                // last token and not the comment
                ast.end = lastToken.end;
                ast.loc.end.line = lastToken.loc.end.line;
                ast.loc.end.column = lastToken.loc.end.column;
            }
        }
    }
}

export default class ASTParser {
    /**
     * @param {ASTSourceOptions} options
     */
    constructor(options) {
        this.options = options;
        this.type = findParserType(options);
        debug("ParserType: %s", this.type);
    }

    /**
     * change parser type
     * @param {ParserTypes} type
     */
    setType(type) {
        this.type = type;
    }

    parse(code) {
        if (this.type === ParserTypes.Esprima) {
            return this._parseByEsprima(code, this.options);
        } else if (this.type === ParserTypes.Babylon) {
            return this._parseByBabel(code, this.options);
        }
        throw new Error("unreachable #parse");
    }

    /**
     * @param code
     * @param {ASTSourceOptions} options
     * @returns {Object}
     * @private
     */
    _parseByEsprima(code, options) {
        var esprimaOptions = {
            source: options.filePath,
            loc: options.loc,
            range: options.range,
            comment: options.comment,
            attachComment: options.comment,
            tokens: options.esprimaTokens,
            sourceType: options.sourceType || "module"
        };
        return esprima.parse(code, esprimaOptions);
    }

    _parseByBabel(code, options) {
        var babylonOptions = {
            sourceFile: options.filePath,
            locations: options.loc,
            ranges: options.range,
            sourceType: options.sourceType || "module",
            strictMode: true,
            allowImportExportEverywhere: false, // consistent with espree
            allowReturnOutsideFunction: true,
            allowSuperOutsideMethod: true,
            plugins: [
                "flow",
                "jsx",
                "asyncFunctions",
                "asyncGenerators",
                "classConstructorCall",
                "classProperties",
                "decorators",
                "doExpressions",
                "exponentiationOperator",
                "exportExtensions",
                "functionBind",
                "functionSent",
                "objectRestSpread",
                "trailingFunctionCommas"
            ]
        };
        return parseToEsprima(code, babylonOptions);
    }
}
