// LICENSE : MIT
"use strict";

const parse = require("babylon").parse;
const acornToEsprima = require("acorn-to-esprima");
export function parseToEsprima(code, opts) {
    var comments = (opts.onComment = []);
    var tokens = (opts.onToken = []);

    var ast;
    try {
        ast = parse(code, opts);
    } catch (err) {
        throw err;
    }

    tokens.pop();
    if (opts.comment) {
        // add comments
        for (var i = 0; i < comments.length; i++) {
            var comment = comments[i];
            if (comment.type === "CommentBlock") {
                comment.type = "Block";
            } else if (comment.type === "CommentLine") {
                comment.type = "Line";
            }
        }
        ast.comments = comments;
    }
    // acorn to esprima
    if (opts.esprimaTokens) {
        // convert tokens
        ast.tokens = acornToEsprima.toTokens(tokens);
        acornToEsprima(ast, comments, ast.tokens);

        // transform esprima and acorn divergent nodes
        acornToEsprima.toAST(ast);
    }
    return ast;
}
