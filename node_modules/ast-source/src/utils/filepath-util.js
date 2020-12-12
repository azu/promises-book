// LICENSE : MIT
"use strict";
import fs from "fs";
import isAbsolute from "path-is-absolute";
// code from https://github.com/power-assert-js/espower-source
export function adjustFilePath(filepath, sourceRoot) {
    if (!sourceRoot || !isAbsolute(filepath)) {
        return filepath;
    }
    var relativePath = _path.relative(sourceRoot, filepath);
    if (relativePath.split(_path.sep).indexOf("..") !== -1) {
        // if absolute filePath conflicts with sourceRoot, use filepath only.
        return filepath;
    }
    return relativePath;
}
export function hasExistDirectory(dirPath) {
    try {
        // Query the entry
        var stats = fs.lstatSync(dirPath);

        // Is it a directory?
        if (stats.isDirectory()) {
            return true;
        }
    } catch (e) {
        return false;
    }
    return false;
}
