"use strict";
var gulp = require("gulp");
var path = require("path");
var rename = require("gulp-rename");
var inlining = require("gulp-inlining-node-require");
var removeUseString = require("gulp-remove-use-strict");
var browserify = require('browserify');
var minifyify = require("minifyify");
var source = require('vinyl-source-stream');
var sourceFile = "./public/js/index.js";
var destDir = "./public/js/build/";
gulp.task("build-js", function () {
    return browserify(sourceFile)
        .bundle()
        .pipe(source("app.js"))
        .pipe(gulp.dest(destDir));
});
gulp.task("build-min-js", function () {
    return browserify(sourceFile)
        .plugin('minifyify', {
            map: 'app.min.js.map',
            output: destDir + 'app.min.js.map',
            compressPath: function (p) {
                return path.relative('./', p);
            }
        })
        .bundle()
        .pipe(source("app.js"))
        .pipe(gulp.dest(destDir));
});
gulp.task("embed", function () {
    return gulp.src(["./Ch*/src/**/*.js", "./Ch*/lib/*.js", "./Ch3_Testing/test/*.js"], {base: './'})
        .pipe(inlining())
        .pipe(removeUseString({
            force: true
        }))
        .pipe(rename(function (filePath) {
            var filePathBySplit = filePath.dirname.split(path.sep);
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
gulp.task("lint-html", function (callback) {
    global.Promise = require("ypromise");
    var File = require("./Ch4_AdvancedPromises/src/promise-chain/fs-promise-chain");
    var checkHTML = require("./test/html/missing-internal-link").checkInternalLinks;

    var htmlPromise = File.read("index.html").then(function (contents) {
        var errors = checkHTML(contents);
        if (errors.length > 0) {
            errors.forEach(function (error) {
                console.error(error.message);
            });
            return callback(new Error("Found lint error"));
        }
        callback();
    });
    var asciidocPromise = require("./test/inline-script/inline-script-tester")
        .checkInlineScript("./");
    Promise.all([htmlPromise, asciidocPromise])
        .catch(callback);
});
gulp.on('err', function (error) {
    process.exit(1);
});