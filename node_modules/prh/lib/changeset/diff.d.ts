import { Rule } from "../rule";
export interface DiffParams {
    pattern: RegExp;
    expected?: string;
    index: number;
    matches: string[];
    rule?: Rule;
}
export declare class Diff {
    pattern: RegExp;
    expected?: string;
    index: number;
    matches: string[];
    rule?: Rule;
    constructor(params: DiffParams);
    readonly tailIndex: number;
    readonly newText: string | null;
    /**
     * Diffの結果を元の文章に反映する
     * @param content 置き換えたいコンテンツ
     * @param delta diffの処理対象の地点がいくつズレているか 複数diffを順次適用する場合に必要
     */
    apply(content: string, delta?: number): {
        replaced: string;
        newDelta: number;
    } | null;
    isEncloser(other: {
        index: number;
        tailIndex: number;
    }): boolean;
    isCollide(other: {
        index: number;
        tailIndex: number;
    }): boolean;
    isBefore(other: {
        index: number;
    }): boolean;
    toJSON(): any;
}
