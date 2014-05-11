"use strict";
var gulp = require("gulp");
var rename = require("gulp-rename");
var inlining = require("gulp-inlining-node-require");
var removeUseString = require("gulp-remove-use-strict");
gulp.task("embed", function () {
    return gulp.src(["./Ch*/src/*.js", "./Ch*/lib/*.js", "./Ch3_Testing/test/*.js"], {base: './'})
        .pipe(inlining())
        .pipe(removeUseString())
        .pipe(rename(function (path) {
            var paths = path.dirname.split("/");
            paths.pop();
            path.dirname = paths.join("/") + "/embed";
            path.basename = "embed-" + path.basename;
        }))
        .pipe(gulp.dest("./"));
});
gulp.task("lint-html", function (callback) {
    global.Promise = require("ypromise");
    var File = require("./Ch4_AdvancedPromises/src/fs-promise-chain");
    var checkHTML = require("./test/html/missing-internal-link").checkInternalLinks;
    File.read("index.html").then(function (contents) {
        var errors = checkHTML(contents);
        if (errors.length > 0) {
            errors.forEach(function (error) {
                console.error(error.message);
            });
            return callback(new Error("Found lint error"));
        }
        callback();
    }).catch(callback);
});
gulp.on('err', function (error) {
    process.exit(1);
});