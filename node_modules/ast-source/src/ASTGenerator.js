// LICENSE : MIT
"use strict";
import assert from "assert";
import { generate } from "escodegen";
import babelGenerate from "@babel/generator";
import { adjustFilePath } from "./utils/filepath-util";
import { ParserTypes, findParserType } from "./utils/find-parser";
export default class ASTGenerator {
    /**
     * @param {ASTSourceOptions} options
     */
    constructor(options) {
        /**
         * @type {ASTSourceOptions}
         */
        this.options = options;
        this.type = findParserType(options);
    }

    _sourceCodePath() {
        return adjustFilePath(this.options.filePath, this.options.sourceRoot);
    }

    /**
     * generate code(only)
     * @param {Object}AST
     * @returns {string}
     */
    generateCode(AST) {
        if (this.type === ParserTypes.Esprima) {
            return generate(AST, {
                comment: this.options.comment
            });
        } else if (this.type === ParserTypes.Babylon) {
            return babelGenerate(AST);
        }
    }

    /**
     * generate code and source map
     * @param {Object} AST
     * @param {{sourceContent: string}} sourceContent sourceContent is original code for SourceMap
     * @returns {{code: string, map: Object}}
     */
    generateCodeWithMap(AST, { sourceContent }) {
        assert(sourceContent != null, "sourceContent is required. `generate(AST, {sourceContent})`");
        if (this.type === ParserTypes.Esprima) {
            const generateOption = {
                comment: this.options.comment,
                sourceMap: this._sourceCodePath(),
                sourceContent: sourceContent,
                sourceMapWithCode: true
            };
            const { code, map } = generate(AST, generateOption);
            return { code, map };
        } else if (this.type === ParserTypes.Babylon) {
            return babelGenerate(AST, {}, sourceContent);
        }
    }
}
