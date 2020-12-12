// LICENSE : MIT
"use strict";
import traverse from "@babel/traverse"
import template from "@babel/template"

type Node = import("@babel/traverse").Node

export function injectAssertModule(AST: Node) {
    traverse(AST, {
        Program: {
            enter(path) {
                (path as any).unshiftContainer("body", template`var assert = require("power-assert")`())
            }
        }
    });
    return AST;
}
