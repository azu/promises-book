import { NodeVM, VMScript } from "vm2";
import { convertCode } from "@power-doctest/core";
import { ParsedCode } from "@power-doctest/types";

const assert = require("power-assert");

export interface PowerDoctestRunnerOptions {
    // pseudo file path for code
    filePath?: string;
    // sandbox context for code
    // context defined global variables
    context?: {
        [index: string]: any
    }
    // sandbox require mock for code
    requireMock?: {
        [index: string]: any
    }
    // If it is true, console.log output to console
    // If you want to mock console, please pass `console` to `context: { console: consoleMock }`
    //
    // Exception:
    // Always suppress console and assertion, because it is converted to assert function
    // ```
    // console.log(1); // => 1
    // ```
    console?: boolean;
    // Timeout millisecond
    // Default: 2000
    timeout?: number
    // Default: all
    // If runMode is all, all assertions are finished and resolve it
    // If runMode is any, anyone assertion is finished and resolve it
    // In Both, anyone is failed and reject it
    runMode?: "any" | "all";
    // Internal Option
    powerDoctestCallbackFunctionName?: string;
}

const CALLBACK_FUNCTION_NAME = "__power_doctest_runner_callback__";

export interface testOptions {
    // if it is true and Each testOptions.state is "none", run the test
    // if it is false and Each testOptions.state is "none", do not run the test
    // Default: false
    disableRunning: boolean;
    // default values for doctestRunnerOptions
    // It is override by test case's `doctestRunnerOptions`.
    defaultDoctestRunnerOptions?: PowerDoctestRunnerOptions;
}


export function test(parsedCode: ParsedCode, oprions?: testOptions): Promise<void> {
    if (parsedCode.state === "disabled") {
        return Promise.resolve();
    }
    if (oprions && oprions.disableRunning && parsedCode.state === "none") {
        return Promise.resolve();
    }
    return run(parsedCode.code, {
        ...(oprions && oprions.defaultDoctestRunnerOptions ? oprions.defaultDoctestRunnerOptions : {}),
        ...parsedCode.doctestOptions
    }).catch(error => {
        // if it is expected error, resolve it
        if (parsedCode.expectedError && error.name === parsedCode.expectedError) {
            return Promise.resolve();
        }
        const doctestOptions: PowerDoctestRunnerOptions | undefined = parsedCode.doctestOptions;
        error.fileName = doctestOptions && doctestOptions.filePath
            ? doctestOptions.filePath
            : error.fileName;
        error.lineNumber = parsedCode.location.start.line;
        error.columnNumber = parsedCode.location.start.column;
        const metadata = parsedCode.metadata;
        if (metadata) {
            error.meta = metadata;
        }
        return Promise.reject(error);
    });
}


export function run(code: string, options: PowerDoctestRunnerOptions = {}): Promise<void> {
    const filePath = options.filePath || "default.js";
    const runMode = options.runMode || "all";
    const timeout = options.timeout !== undefined ? options.timeout : 2000;
    const postCallbackName = options.powerDoctestCallbackFunctionName || CALLBACK_FUNCTION_NAME;
    const context = options.context || {};
    return new Promise((resolve, reject) => {
        let isSettled = false;
        const timeoutId = setTimeout(() => {
            if (isSettled) {
                return;
            }
            restoreListener();
            reject(new Error(`Timeout error

${runMode === "all" ? `If you use { "runMode": "all" }, you should check all condition flow is passed.

Total Assertion: ${totalAssertionCount}
Executed Assertion: ${countOfExecutedAssertion}

Also, you should consider to use { "runMode": "any" }` : ""}`));
        }, timeout);
        // Test Runner like mocha listen unhandledRejection and uncaughtException
        // Disable these listener before running code
        const originalUnhandledRejection = process.listeners("unhandledRejection");
        const originalUncaughtException = process.listeners("uncaughtException");
        process.removeAllListeners("uncaughtException");
        process.removeAllListeners("unhandledRejection");
        const unhandledRejection = (reason: {}, _promise: Promise<any>): void => {
            restoreListener();
            reject(reason);
        };
        const uncaughtException = (error: Error): void => {
            restoreListener();
            reject(error);
        };
        const restoreListener = () => {
            isSettled = true;
            process.removeListener("uncaughtException", uncaughtException);
            process.removeListener("unhandledRejection", unhandledRejection);
            // restore
            const currentUncaughtException = process.listeners("uncaughtException");
            const currentUnhandledRejection = process.listeners("unhandledRejection");
            originalUncaughtException.filter(listener => {
                // remove duplicated
                return !currentUncaughtException.includes(listener);
            }).forEach(listener => {
                process.addListener("uncaughtException", listener);
            });
            originalUnhandledRejection.filter(listener => {
                // remove duplicated
                return !currentUnhandledRejection.includes(listener);
            }).forEach(listener => {
                process.addListener("unhandledRejection", listener);
            });
            // clearTimeout
            clearTimeout(timeoutId);
        };
        process.on("uncaughtException", uncaughtException);
        process.on("unhandledRejection", unhandledRejection as any);
        const poweredCode = convertCode(code, {
            assertAfterCallbackName: postCallbackName,
            filePath: filePath
        });
        // total count of assert
        const totalAssertionCount = poweredCode.split(CALLBACK_FUNCTION_NAME).length - 1;
        // current count of assert
        let countOfExecutedAssertion = 0;
        const vm = new NodeVM({
            console: options.console ? "inherit" : "off",
            timeout: timeout,
            sandbox: {
                [postCallbackName]: (_id: string) => {
                    countOfExecutedAssertion++;
                    if (runMode === "all" && countOfExecutedAssertion === totalAssertionCount) {
                        // when all finish
                        restoreListener();
                        resolve();
                    } else if (runMode === "any") {
                        // when anyone finish
                        restoreListener();
                        resolve();
                    }
                },
                // User defined context
                ...context
            },
            require: {
                external: true,
                builtin: ["*"],
                mock: {
                    "power-assert": assert,
                    ...options.requireMock
                }
            }
        });
        try {
            const script = new VMScript(poweredCode, options.filePath);
            vm.run(script, options.filePath);
        } catch (error) {
            restoreListener();
            reject(error);
        }
        // No assertion code
        if (totalAssertionCount === 0) {
            restoreListener();
            resolve();
        }
    });
}
