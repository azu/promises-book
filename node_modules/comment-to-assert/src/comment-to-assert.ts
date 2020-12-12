// LICENSE : MIT
"use strict";
import {
    ERROR_COMMENT_PATTERN,
    PROMISE_REJECT_COMMENT_PATTERN,
    PROMISE_RESOLVE_COMMENT_PATTERN,
    tryGetCodeFromComments,
    wrapAssert,
    wrapAssertOptions
} from "./ast-utils";
import { transformFromAstSync, Node } from "@babel/core";
import { identifier, isExpressionStatement, File } from "@babel/types";
import { parse, parseExpression, ParserOptions } from "@babel/parser";
import traverse from "@babel/traverse";

function getExpressionNodeFromCommentValue(string: string): { type: string } & { [index: string]: any } {
    const message = string.trim();
    if (ERROR_COMMENT_PATTERN.test(message)) {
        const match = message.match(ERROR_COMMENT_PATTERN);
        if (!match) {
            throw new Error(`Can not Parse: // => Error: "message"`);
        }
        return identifier(match[1]);
    }
    if (PROMISE_RESOLVE_COMMENT_PATTERN.test(message)) {
        const match = message.match(PROMISE_RESOLVE_COMMENT_PATTERN);
        if (!match) {
            throw new Error("Can not Parse: // => Resolve: value");
        }
        return {
            type: "Resolve",
            node: getExpressionNodeFromCommentValue(match[1])
        };
    } else if (PROMISE_REJECT_COMMENT_PATTERN.test(message)) {
        const match = message.match(PROMISE_REJECT_COMMENT_PATTERN);
        if (!match) {
            throw new Error("Can not Parse: // => Reject: value");
        }
        return {
            type: "Reject",
            node: getExpressionNodeFromCommentValue(match[1])
        };
    }
    try {
        return parseExpression(string);
    } catch (e) {
        console.error(`Can't parse comments // => expression`);
        throw e;
    }
}

export type toAssertFromSourceOptions = {
    babel?: ParserOptions;
} & wrapAssertOptions;

/**
 * transform code to asserted code
 * if want to source map, use toAssertFromAST.
 */
export function toAssertFromSource(code: string, options?: toAssertFromSourceOptions) {
    const ast = parse(code, {
        // parse in strict mode and allow module declarations
        sourceType: "module",
        ...(options && options.babel ? options.babel : {})
    });
    if (!ast) {
        throw new Error("Can not parse the code");
    }
    const output = toAssertFromAST(ast, options);
    const babelFileResult = transformFromAstSync(output as Node, code, { comments: true });
    if (!babelFileResult) {
        throw new Error("can not generate from ast: " + JSON.stringify(output));
    }
    return babelFileResult.code;
}

/**
 * transform AST to asserted AST.
 */
export function toAssertFromAST<T extends File>(ast: T, options: wrapAssertOptions = {}): T {
    const replaceSet = new Set();
    let id = 0;
    traverse(ast, {
        exit(path) {
            if (!replaceSet.has(path.node) && path.node.trailingComments) {
                const commentExpression = tryGetCodeFromComments(path.node.trailingComments);
                if (commentExpression) {
                    const commentExpressionNode = getExpressionNodeFromCommentValue(commentExpression);
                    const actualNode = isExpressionStatement(path.node) ? path.node.expression : path.node;
                    const replacement = wrapAssert(
                        {
                            actualNode: actualNode,
                            expectedNode: commentExpressionNode,
                            commentExpression,
                            id: String(`id:${id++}`)
                        },
                        options
                    );
                    if (Array.isArray(replacement)) {
                        // prevent ∞ loop
                        path.node.trailingComments = null;
                        path.replaceWithMultiple(replacement);
                    } else {
                        path.replaceWith(replacement);
                    }
                    replaceSet.add(path.node);
                }
            }
        }
    });
    return ast;
}
