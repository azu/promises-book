var through = require("through2"),
    gutil = require("gulp-util");
var inlining = require("inlining-node-require");
module.exports = function (options) {
    "use strict";

    function inliningNodeRequire(file, enc, callback) {
        /*jshint validthis:true*/

        if (file.isNull()) {
            this.push(file);
            return callback();
        }

        if (file.isStream()) {
            this.emit("error",
                new gutil.PluginError("gulp-inlining-node-require", "Stream content is not supported"));
            return callback();
        }

        // check if file.contents is a `Buffer`
        if (file.isBuffer()) {
            try {
                file.contents = Buffer.from(inlining(file.path, options));
            } catch (error) {
                this.emit("error",
                    new gutil.PluginError("gulp-inlining-node-require", "Could not inlining file " + file.path));
                return callback();
            }
            this.push(file);

        }
        return callback();
    }

    return through.obj(inliningNodeRequire);
};
