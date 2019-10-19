"use strict";
const gulp = require("gulp");
const path = require("path");
const concat = require("gulp-concat");
const rename = require("gulp-rename");
const inlining = require("gulp-inlining-node-require");
const browserify = require("browserify");
const minifyify = require("minifyify");
const source = require("vinyl-source-stream");
const sourceFile = "./public/js/index.js";
const destCSSDir = "./public/css/build/";
const destJSDir = "./public/js/build/";
gulp.task("build-css", () => {
    return gulp.src([
        "./node_modules/codemirror/lib/codemirror.css",
        "./public/css/mirror-console-component.css",
        "./public/css/overload.css"
    ])
        .pipe(concat("all.css"))
        .pipe(gulp.dest(destCSSDir));
});
gulp.task("build-js", () => {
    return browserify(sourceFile)
        .bundle()
        .pipe(source("app.js"))
        .pipe(gulp.dest(destJSDir));
});
gulp.task("build-js-min", () => {
    return browserify({
        debug: true
    })
        .add(sourceFile)
        .plugin("minifyify", {
            map: "app.min.js.map",
            output: destJSDir + "app.min.js.map",
            compressPath: function(p) {
                return path.relative("./", p);
            }
        })
        .bundle()
        .pipe(source("app.js"))
        .pipe(gulp.dest(destJSDir));
});
gulp.task("embed", () => {
    const formatCode = require("./_tools/gulp/format-code");
    return gulp.src(["./Ch*/src/**/*.js", "./Ch*/lib/*.js", "./Ch3_Testing/test/*.js"], { base: "./" })
        .pipe(inlining())
        .pipe(formatCode())
        .pipe(rename((filePath) => {
            const filePathBySplit = filePath.dirname.split(path.sep);
            filePathBySplit.pop();
            // src 以下の階層
            if (filePathBySplit[filePathBySplit.length - 1] === "src") {
                filePathBySplit.pop();
            }
            filePath.dirname = filePathBySplit.join("/") + "/embed";
            filePath.basename = "embed-" + filePath.basename;
        }))
        .pipe(gulp.dest("./"));
});
gulp.task("lint-html", (callback) => {
    const File = require("./Ch4_AdvancedPromises/src/promise-chain/fs-promise-chain");
    const checkHTML = require("./test/html/missing-internal-link").checkInternalLinks;

    const htmlPromise = File.read("index.html").then((contents) => {
        const errors = checkHTML(contents);
        if (errors.length > 0) {
            errors.forEach((error) => {
                console.error(error.message);
            });
            return callback(new Error("Found lint error"));
        }
        callback();
    });
    const asciidocPromise = require("./test/inline-script/inline-script-tester")
        .checkInlineScript("./");
    Promise.all([htmlPromise, asciidocPromise])
        .catch(callback);
});
gulp.on("err", () => {
    process.exit(1);
});
