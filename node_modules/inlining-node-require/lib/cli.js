"use strict";
var fs = require("fs");
var pather = require("path");
module.exports = function (argv) {
    var optionator = require('optionator')({
        prepend: 'Usage: cmd [options]',
        append: 'Version 1.0.0',
        options: [
            {
                option: 'help',
                alias: 'h',
                type: 'Boolean',
                description: 'displays help'
            },
            {
                option: 'entry',
                alias: 'e',
                type: 'String',
                description: 'entry point path',
                example: 'inlining --e index.js'
            },
            {
                option: 'outfile',
                alias: 'o',
                type: 'String',
                description: 'output to file path',
                example: 'inlining --e index.js -o bundle.js'
            }
        ]
    });
    var currentOptions;
    try {
        currentOptions = optionator.parse(argv);
    } catch (error) {
        console.error(error.message);
        return 1;
    }
    if (currentOptions.version) { // version from package.json
        console.log("v" + require("../package.json").version);
    } else if (currentOptions.help) {
        console.log(optionator.generateHelp());
    } else if (currentOptions.entry || currentOptions._.length > 0) {
        var entryPath = currentOptions.entry || currentOptions._[0];
        var result = require("./inlining")(entryPath);
        if (currentOptions.outfile) {
            var output = currentOptions.outfile;
            fs.writeFileSync(pather.basename(output), result, "utf-8");
        } else {
            console.log(result);
        }
    }

    return 0;

};