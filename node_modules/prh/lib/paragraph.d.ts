import { Rule } from "./rule";
import { Diff } from "./changeset/diff";
export declare class Paragraph {
    index: number;
    content: string;
    ignoreAll: boolean;
    ignorePatterns: RegExp[];
    constructor(index: number, content: string);
    makeDiffs(rules: Rule[]): Diff[];
}
