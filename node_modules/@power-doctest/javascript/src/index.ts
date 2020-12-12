import { ParsedResults, ParserArgs } from "@power-doctest/types";
import StructuredSource from "structured-source";

const getState = (code: string): "enabled" | "disabled" | "none" => {
    if (/\/\/\s*doctest-disable(d)?/.test(code)) {
        return "disabled";
    } else if (/\/\/\s*doctest-enable(d)?/.test(code)) {
        return "enabled";
    }
    return "none";
};

const getExpectedError = (code: string): string | undefined => {
    const pattern = /\/\/\s*doctest-error:\s*(\w+Error)/;
    const match = code.match(pattern);
    if (match && match[1]) {
        return match[1];
    }
    return;
};


const getMeta = (code: string): {} | undefined => {
    const pattern = /\/\/\s*doctest-meta:{(.*)}/;
    const match = code.match(pattern);
    const metaString = match && match[1];
    if (!metaString) {
        return;
    }
    try {
        return JSON.parse(metaString);
    } catch (error) {
        // parse error
        throw new Error(`Can not parsed. // doctest-meta:{...} should be JSON object: ${error}`);
    }
};

const getOptions = (code: string): {} | undefined => {
    const pattern = /\/\/\s*doctest-options:{(.*)}/;
    const match = code.match(pattern);
    const metaString = match && match[1];
    if (!metaString) {
        return;
    }
    try {
        return JSON.parse(metaString);
    } catch (error) {
        // parse error
        throw new Error(`Can not parsed. // doctest-options:{...} should be JSON object: ${error}`);
    }
};

export const parse = ({ content, filePath }: ParserArgs): ParsedResults => {
    const source = new StructuredSource(content);
    const meta = getMeta(content);
    const options = getOptions(content);
    return [
        {
            code: content,
            location: {
                start: source.indexToPosition(0),
                end: source.indexToPosition(content.length - 1)
            },
            state: getState(content),
            expectedError: getExpectedError(content),
            metadata: meta,
            doctestOptions: options
                ? {
                    filePath,
                    ...options
                }
                : {
                    filePath
                }
        }
    ];
};
