import { Diff } from "./diff";
export interface ChangeSetParams {
    filePath?: string;
    content: string;
    diffs: Diff[];
}
export declare class ChangeSet {
    filePath?: string;
    content: string;
    diffs: Diff[];
    constructor(params: ChangeSetParams);
    concat(other: ChangeSet): this;
    applyChangeSets(str: string): string;
    subtract(subtrahend: ChangeSet): ChangeSet;
    intersect(audit: ChangeSet): ChangeSet;
}
