"use strict";
var gulp = require("gulp");
var rename = require("gulp-rename");
var inlining = require("gulp-inlining-node-require");
var removeUseString = require("gulp-remove-use-strict");
gulp.task("embed", function () {
    return gulp.src("./Ch*/src/*.js", {base: './'})
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