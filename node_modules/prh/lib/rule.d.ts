import { Options } from "./options";
import { RuleSpec } from "./ruleSpec";
import { Diff } from "./changeset/diff";
import * as raw from "./raw";
export declare class Rule {
    expected: string;
    pattern: RegExp;
    regexpMustEmpty: string | undefined;
    options: Options;
    specs: RuleSpec[];
    raw: any;
    constructor(src: string | raw.Rule);
    reset(): void;
    check(): void;
    applyRule(content: string): Diff[];
    toJSON(): any;
}
