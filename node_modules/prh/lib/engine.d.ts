import * as raw from "./raw";
import { Target } from "./target";
import { Rule } from "./rule";
import { ChangeSet } from "./changeset";
export declare class Engine {
    version: number;
    targets: Target[];
    rules: Rule[];
    sourcePaths: string[];
    constructor(src: raw.Config);
    merge(other: Engine): void;
    makeChangeSet(filePath: string, contentText?: string): ChangeSet;
    replaceByRule(filePath: string, content?: string): string;
}
