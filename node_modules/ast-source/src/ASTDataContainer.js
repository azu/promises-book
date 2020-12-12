// LICENSE : MIT
"use strict";
import assert from "assert";
import espurify from "espurify";
import { healingAST } from "./utils/ast-healing-util";
/**
 * ASTDataContainer has AST as `value` and transform `value`
 */
export default class ASTDataContainer {
    /**
     *
     * @param {Object} ast
     */
    constructor(ast) {
        this.value = ast;
    }

    cloneValue() {
        return espurify(this.value);
    }

    transform(transformFn) {
        const result = transformFn(this.value);
        if (result == null) {
            throw new Error("transform function should not return null");
        }
        this.value = result;
    }

    /**
     * @param transformFn
     * @param {ASTSourceOptions} options
     */
    transformStrict(transformFn, options) {
        var AST = healingAST(this.value, options);
        var result = transformFn(AST);
        assert(result != null && typeof result === "object", "transform function should not return null");
        this.value = result;
    }
}
