export interface Config {
    version: number;
    imports?: string | (string | ImportSpec)[];
    targets?: Target[];
    rules?: (string | Rule)[];
}
export interface ImportSpec {
    path: string;
    disableImports?: boolean;
    ignoreRules?: (string | IgnoreRule)[];
}
export interface IgnoreRule {
    pattern?: string;
    expected?: string;
}
export interface Target {
    file: string;
    includes?: (string | TargetPattern)[];
    excludes?: (string | TargetPattern)[];
}
export interface TargetPattern {
    pattern: string;
}
export interface Rule {
    expected: string;
    pattern?: string | string[] | null;
    patterns?: string | string[] | null;
    regexpMustEmpty?: string;
    options?: Options;
    specs?: RuleSpec[];
}
export interface Options {
    wordBoundary?: boolean;
}
export interface RuleSpec {
    from: string;
    to: string;
}
