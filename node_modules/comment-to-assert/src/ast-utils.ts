// LICENSE : MIT
"use strict";
import * as assert from "assert";
import {
    CallExpression,
    Comment,
    isCallExpression,
    isIdentifier,
    isLiteral,
    isNullLiteral,
    isDirective,
    callExpression,
    identifier,
    stringLiteral
} from "@babel/types";
import template from "@babel/template";

const commentCodeRegExp = /=>\s*?(.*?)$/i;

export function tryGetCodeFromComments(comments: ReadonlyArray<Comment>) {
    if (comments.length === 0) {
        return;
    }
    var comment = comments[0];
    if (comment.type === "CommentBlock" || comment.type === "CommentLine") {
        var matchResult = comment.value.match(commentCodeRegExp);
        if (matchResult && matchResult[1]) {
            return matchResult[1];
        }
    }
    return;
}

function isConsole(node: any): node is CallExpression & { expression: any } {
    return isCallExpression(node) && (node.callee as any).object && (node.callee as any).object.name === "console";
}

export const ERROR_COMMENT_PATTERN = /^([a-zA-Z]*?Error)/;
export const PROMISE_RESOLVE_COMMENT_PATTERN = /^Resolve:\s*(.*?)\s*$/;
export const PROMISE_REJECT_COMMENT_PATTERN = /^Reject:\s*(.*?)\s*$/;

export interface wrapAssertOptions {
    // callback name before assert
    assertBeforeCallbackName?: string;
    // callback name after assert
    assertAfterCallbackName?: string;
}

export function wrapAssert(
    {
        actualNode,
        expectedNode,
        commentExpression,
        id
    }: { actualNode: any; expectedNode: any; commentExpression: string; id: string },
    options: wrapAssertOptions
): any {
    assert.notStrictEqual(typeof expectedNode, "undefined");
    const ACTUAL_NODE = actualNode;
    const EXPECTED_NODE = expectedNode;
    const BEFORE_CALLBACK = options.assertBeforeCallbackName
        ? callExpression(identifier(options.assertBeforeCallbackName), [stringLiteral(id)])
        : undefined;
    const AFTER_CALLBACK = options.assertAfterCallbackName
        ? callExpression(identifier(options.assertAfterCallbackName), [stringLiteral(id)])
        : undefined;
    if (isConsole(actualNode)) {
        const args = actualNode.arguments;
        const firstArgument = args[0];
        return wrapAssert(
            {
                actualNode: firstArgument,
                expectedNode,
                commentExpression,
                id
            },
            options
        );
    } else if (isIdentifier(expectedNode) && ERROR_COMMENT_PATTERN.test(expectedNode.name)) {
        return template`BEFORE_CALLBACK;assert.throws(function() {
                    ACTUAL_NODE
               });AFTER_CALLBACK;`({
            BEFORE_CALLBACK,
            AFTER_CALLBACK,
            ACTUAL_NODE
        });
    } else if (expectedNode.type === "Resolve") {
        // getExpressionNodeFromCommentValue define the type
        const ARGS = isConsole(actualNode) ? actualNode.arguments[0] : actualNode;
        return template`Promise.resolve(ARGS).then(v => {
            ${wrapAssert(
                {
                    actualNode: { type: "Identifier", name: "v" },
                    expectedNode: expectedNode.node,
                    commentExpression,
                    id
                },
                options
            )}
            return v;
        });`({
            ARGS
        });
    } else if (expectedNode.type === "Reject") {
        const ARGS = isConsole(actualNode) ? actualNode.arguments[0] : actualNode;
        return template`BEFORE_CALLBACK;assert.rejects(ARGS).then(() => {
        AFTER_CALLBACK;
});`({
            BEFORE_CALLBACK,
            AFTER_CALLBACK,
            ARGS
        });
    } else if (isIdentifier(expectedNode) && expectedNode.name === "NaN") {
        return template`BEFORE_CALLBACK;assert.ok(isNaN(ACTUAL_NODE));AFTER_CALLBACK;`({
            BEFORE_CALLBACK,
            AFTER_CALLBACK,
            ACTUAL_NODE
        });
    } else if (isNullLiteral(expectedNode)) {
        return template`BEFORE_CALLBACK;assert.strictEqual(ACTUAL_NODE, null);AFTER_CALLBACK;`({
            BEFORE_CALLBACK,
            AFTER_CALLBACK,
            ACTUAL_NODE
        });
    } else if (isIdentifier(expectedNode) && expectedNode.name === "undefined") {
        return template`BEFORE_CALLBACK;assert.strictEqual(ACTUAL_NODE, undefined);AFTER_CALLBACK`({
            BEFORE_CALLBACK,
            AFTER_CALLBACK,
            ACTUAL_NODE
        });
    } else if (isLiteral(expectedNode)) {
        // Handle Directive Prorogue as string literal
        if (isDirective(ACTUAL_NODE)) {
            return template`BEFORE_CALLBACK;assert.strictEqual(ACTUAL_NODE, EXPECTED_NODE);AFTER_CALLBACK;`({
                BEFORE_CALLBACK,
                AFTER_CALLBACK,
                ACTUAL_NODE: (ACTUAL_NODE.value as any).extra.raw,
                EXPECTED_NODE
            });
        } else {
            return template`BEFORE_CALLBACK;assert.strictEqual(ACTUAL_NODE, EXPECTED_NODE);AFTER_CALLBACK;`({
                BEFORE_CALLBACK,
                AFTER_CALLBACK,
                ACTUAL_NODE,
                EXPECTED_NODE
            });
        }
    } else {
        return template`BEFORE_CALLBACK;assert.deepStrictEqual(ACTUAL_NODE, EXPECTED_NODE);AFTER_CALLBACK;`({
            BEFORE_CALLBACK,
            AFTER_CALLBACK,
            ACTUAL_NODE,
            EXPECTED_NODE
        });
    }
    throw new Error("Unknown pattern: " + actualNode);
}
