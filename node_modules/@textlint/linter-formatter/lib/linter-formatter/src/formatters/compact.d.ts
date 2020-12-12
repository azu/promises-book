/**
 * @fileoverview Compact reporter
 * @author Nicholas C. Zakas
 */
import { TextlintResult } from "@textlint/types";
declare function formatter(results: TextlintResult[]): string;
export default formatter;
