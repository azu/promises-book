import * as raw from "./raw";
import { TargetPattern } from "./targetPattern";
export declare class Target {
    file: RegExp;
    includes: TargetPattern[];
    excludes: TargetPattern[];
    constructor(src: raw.Target);
    reset(): void;
    toJSON(): any;
}
