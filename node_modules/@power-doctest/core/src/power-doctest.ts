// LICENSE : MIT
"use strict";
import { parse, ParserOptions } from "@babel/parser";
import { File } from "@babel/types";
import { transformSync } from "@babel/core";
import generate from "@babel/generator";
import assert from "assert";
import { toAssertFromAST } from "comment-to-assert";
import { injectAssertModule } from "./inject-assert";
const babelPluginEspower = require("babel-plugin-espower");
export interface convertCodeOption {
    filePath: string;
    babel?: ParserOptions;
    assertBeforeCallbackName?: string;
    assertAfterCallbackName?: string;
}

/**
 * Convert Code to Code
 * @param code
 * @param options
 */
export function convertCode(code: string, options: convertCodeOption): string {
    const AST = parse(code, {
        sourceType: "module",
        ...options.babel ? options.babel : {}
    });
    const output = convertAST(AST, {
        assertBeforeCallbackName: options.assertBeforeCallbackName,
        assertAfterCallbackName: options.assertAfterCallbackName,
        filePath: options.filePath
    });
    return generate(output as any, {
        comments: true
    }).code;
}

export interface convertASTOptions {
    assertBeforeCallbackName?: string;
    assertAfterCallbackName?: string;
    // pseudo file path
    filePath: string;
}

/**
 * Convert AST to AST
 * @param AST
 * @param options
 */
export function convertAST<T extends File>(AST: T, options: convertASTOptions): T {
    const boundEspower = (AST: T) => {
        // FIXME: AST to AST
        const { code } = generate(AST, {
            comments: true
        });
        const result = transformSync(code, {
            plugins: [babelPluginEspower],
            filename: options.filePath,
            sourceFileName: options.filePath,
            ast: true,
            code: false,
            configFile: false,
            babelrc: false,
            sourceType: "module"
        });
        if (!result) {
            throw new Error("Fail to convert espower in power-doctest");
        }
        return result.ast;
    };
    const commentToAssert = (AST: T) => {
        return toAssertFromAST(AST, options);
    };
    const modifyMapFunctionList: ((ast: any) => any)[] = [commentToAssert, injectAssertModule, boundEspower];
    return modifyMapFunctionList.reduce((AST, modify, index) => {
        const result = modify(AST);
        assert(result != null, modifyMapFunctionList[index].name + " return wrong result. result: " + result);
        return result;
    }, AST as T);
}
