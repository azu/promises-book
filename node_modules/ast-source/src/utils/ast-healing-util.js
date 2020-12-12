// LICENSE : MIT
"use strict";
import ASTGenerator from "./../ASTGenerator";
import ASTParser from "./../ASTParser";
/**
 * healing ast with options.
 * ensure valid AST for options.
 *
 * provide `range`, `loc` etc...
 * @param AST
 * @param {ASTSourceOptions} options
 */
export function healingAST(AST, options) {
    var parser = new ASTParser(options);
    var generator = new ASTGenerator(options);
    return parser.parse(generator.generateCode(AST));
}
