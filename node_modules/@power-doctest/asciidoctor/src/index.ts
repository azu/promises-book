import StructuredSource from "structured-source";
import { ParsedCode, ParsedResults, ParserArgs } from "@power-doctest/types";
import * as fs from "fs";
import * as path from "path";

const Asciidoctor = require("asciidoctor");
const asciidoctor = Asciidoctor();
type Attributes = {
    [index: string]: string;
}
const getState = (attributes: Attributes): "none" | "enabled" | "disabled" => {
    const state = attributes["doctest-state"] || attributes["doctest"];
    if (!state) {
        return "none";
    }
    if (/enable(d)?/.test(state)) {
        return "enabled";
    } else if (/disable(d)?/.test(state)) {
        return "disabled";
    }
    return "none";
};

const getExpectedError = (attributes: Attributes): string | undefined => {
    const error = attributes["doctest-error"] || attributes["doctest"];
    if (!error) {
        return;
    }
    const pattern = /(\w+Error)/;
    const match = error.match(pattern);
    if (match && match[1]) {
        return match[1];
    }
    return;
};

const getMeta = (attributes: Attributes): {} | undefined => {
    const meta = attributes["doctest-meta"];
    if (!meta) {
        return;
    }
    try {
        return JSON.parse(meta);
    } catch (error) {
        // parse error
        throw new Error(`Can not parsed. doctest-meta={...} should be JSON object: ${error}`);
    }
};

const getOptions = (attributes: Attributes): {} | undefined => {
    const meta = attributes["doctest-options"];
    if (!meta) {
        return;
    }
    try {
        return JSON.parse(meta);
    } catch (error) {
        // parse error
        throw new Error(`Can not parsed. doctest-options={...} should be JSON object: ${error}`);
    }
};

// inlining include::
const inlineCode = (code: string, baseFilePath: string): string => {
    // include:: -> link:
    const pattern = /link:(.+)\[.*?]/;
    const dirName = path.dirname(baseFilePath);
    return code.replace(pattern, (all, filePath) => {
        const fileName = path.resolve(dirName, filePath);
        if (fs.existsSync(fileName)) {
            return fs.readFileSync(fileName, "utf-8");
        }
        return all;
    });
};

export function parse(args: ParserArgs): ParsedResults {
    const structuredSource = new StructuredSource(args.content);
    const doc = asciidoctor.load(args.content);
    return doc.getBlocks()
        .filter((block: any) => {
            const attributes = block.getAttributes();
            return attributes.style === "source" && (attributes.language === "js" || attributes.language === "javascript");
        })
        .map((block: any) => {
            // FIXME: workaround get lineno
            // asciidoctor.js does not suport lineno for the block
            const code: string = block.getSource();
            const index = args.content.indexOf(code);
            const startPosition = structuredSource.indexToPosition(index);
            const endPostion = structuredSource.indexToPosition(index + code.length);
            const attributes: {} = block.getAttributes();
            const meta = getMeta(attributes);
            const doctestOptions = getOptions(attributes);
            const parsedCode: ParsedCode = {
                code: inlineCode(code, args.filePath),
                state: getState(attributes),
                expectedError: getExpectedError(attributes),
                location: {
                    start: startPosition,
                    end: endPostion
                },
                metadata: meta,
                doctestOptions: doctestOptions ? {
                    filePath: args.filePath,
                    ...doctestOptions
                } : {
                    filePath: args.filePath
                }
            };
            return parsedCode;
        });
}
