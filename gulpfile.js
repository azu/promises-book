"use strict";
var gulp = require("gulp");
var path = require("path");
var concat = require('gulp-concat');
var rename = require("gulp-rename");
var inlining = require("gulp-inlining-node-require");
var removeUseString = require("gulp-remove-use-strict");
var browserify = require('browserify');
var minifyify = require("minifyify");
var source = require('vinyl-source-stream');
var sourceFile = "./public/js/index.js";
var destCSSDir = "./public/css/build/";
var destJSDir = "./public/js/build/";
gulp.task("build-css", function() {
    return gulp.src([
        "./node_modules/codemirror/lib/codemirror.css",
        "./public/css/mirror-console-component.css",
        "./public/css/overload.css"
    ])
        .pipe(concat('all.css'))
        .pipe(gulp.dest(destCSSDir));
});
gulp.task("build-js", function() {
    return browserify(sourceFile)
        .bundle()
        .pipe(source("app.js"))
        .pipe(gulp.dest(destJSDir));
});
gulp.task("build-js-min", function() {
    return browserify({
        debug: true
    })
        .add(sourceFile)
        .plugin('minifyify', {
            map: 'app.min.js.map',
            output: destJSDir + 'app.min.js.map',
            compressPath: function(p) {
                return path.relative('./', p);
            }
        })
        .bundle()
        .pipe(source("app.js"))
        .pipe(gulp.dest(destJSDir));
});
gulp.task("embed", function() {
    var replacePowerAssert = require("./_tools/gulp/replate-power-assert.js");
    return gulp.src(["./Ch*/src/**/*.js", "./Ch*/lib/*.js", "./Ch3_Testing/test/*.js"], { base: './' })
        .pipe(inlining())
        .pipe(replacePowerAssert())
        .pipe(removeUseString({
            force: true
        }))
        .pipe(rename(function(filePath) {
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
gulp.task("lint-html", function(callback) {
    require("native-promise-only");
    var File = require("./Ch4_AdvancedPromises/src/promise-chain/fs-promise-chain");
    var checkHTML = require("./test/html/missing-internal-link").checkInternalLinks;

    var htmlPromise = File.read("index.html").then(function(contents) {
        var errors = checkHTML(contents);
        if (errors.length > 0) {
            errors.forEach(function(error) {
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
gulp.on('err', function(error) {
    process.exit(1);
});
