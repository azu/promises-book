import { Diff } from "./diff";
import { ChangeSet } from "./changeset";
export { ChangeSet, Diff };
export declare function makeChangeSet(filePath: string, content: string, pattern: RegExp, expected?: string): ChangeSet;
