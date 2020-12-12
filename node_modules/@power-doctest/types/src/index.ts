export type ParsedCode = {
    code: string;
    location: {
        start: {
            line: number;
            column: number;
        },
        end: {
            line: number;
            column: number;
        }
    },
    /**
     * If it is "none", use default state of tester
     */
    state: "enabled" | "disabled" | "none";
    expectedError?: "Error" | string;
    metadata?: {};
    doctestOptions?: {}
}
export type ParsedResults = ParsedCode[];
export type ParserArgs = {
    content: string;
    filePath: string;
};
