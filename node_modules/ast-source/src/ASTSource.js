// LICENSE : MIT
"use strict";
import assert from "assert";
import ASTParser from "./ASTParser";
import ASTGenerator from "./ASTGenerator";
import ASTOutput from "./ASTOutput";
import ObjectAssign from "object-assign";
export { ParserTypes } from "./utils/find-parser";
import ASTDataContainer from "./ASTDataContainer";
export { ASTDataContainer };
var debug = require("debug")("ASTSource");
/**
 * @type {Object} ASTSourceOptions
 * @property {string} ASTSourceOptions.filePath? path to source code
 * @property {string} ASTSourceOptions.sourceRoot? source root path to source code
 * @property {parserType} ASTSourceOptions.parserType? what parser is used
 * @property {boolean} ASTSourceOptions.esprimaTokens? tokens
 * @property {boolean} ASTSourceOptions.range? range
 * @property {boolean} ASTSourceOptions.loc? location
 * @property {boolean} ASTSourceOptions.comment?
 */
const defaultOptions = {
    filePath: null,
    disableSourceMap: false,
    parserType: null,
    esprimaTokens: true,
    loc: true,
    range: true,
    comment: true
};
export function validateCode(code) {
    assert(typeof code !== "undefined");
}
export function validateOptions(options) {
    if (!options.disableSourceMap) {
        assert(typeof options.filePath === "string", "`options.filePath` is required for sourcemap support");
    }
}
export default class ASTSource {
    constructor(code, options) {
        this.code = code;
        this.options = ObjectAssign({}, defaultOptions, options);
        validateCode(code);
        validateOptions(this.options);
        this.parser = new ASTParser(this.options);
        this.generator = new ASTGenerator(this.options);
        /** @type {Object} AST object */
        this.dataContainer = new ASTDataContainer(this.parse(this.code));
        debug("options: %o", this.options);
    }

    value() {
        return this.dataContainer.value;
    }

    /**
     * return cloned AST
     * @return {Object}
     */
    cloneValue() {
        return this.dataContainer.cloneValue();
    }

    parse(code) {
        return this.parser.parse(code);
    }

    /**
     * transform AST by transformFn.
     * @param {function} transformFn
     * @example
     * function transformFn(AST){
     *    return modify(AST)
     * }
     * source.transform(transformFn);
     */
    transform(transformFn) {
        this.dataContainer.transform(transformFn);
        return this;
    }

    /**
     * transform AST after healing the AST.
     * @param {function} transformFn
     */
    transformStrict(transformFn) {
        this.dataContainer.transformStrict(transformFn, this.options);
        return this;
    }

    /**
     * @returns {ASTOutput}
     */
    output() {
        // when sourcemap is disable, only generate code
        if (this.options.disableSourceMap) {
            return new ASTOutput(this.generator.generateCode(this.dataContainer.value));
        }
        var { code, map } = this.generator.generateCodeWithMap(this.dataContainer.value, {
            sourceContent: this.code
        });
        return new ASTOutput(code, map);
    }
}
