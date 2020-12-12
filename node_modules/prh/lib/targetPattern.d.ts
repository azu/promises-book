import * as raw from "./raw";
export declare class TargetPattern {
    pattern: RegExp;
    constructor(src: string | raw.TargetPattern);
    reset(): void;
    toJSON(): any;
}
