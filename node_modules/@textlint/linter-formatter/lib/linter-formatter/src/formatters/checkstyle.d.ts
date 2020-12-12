/**
 * @fileoverview CheckStyle XML reporter
 * @author Ian Christian Myers
 */
import { TextlintResult } from "@textlint/types";
declare function formatter(results: TextlintResult[]): string;
export default formatter;
