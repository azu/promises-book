/**
 * @fileoverview TAP reporter
 * @author Jonathan Kingston
 */
import { TextlintResult } from "@textlint/types";
declare function formatter(results: TextlintResult[]): string;
export default formatter;
