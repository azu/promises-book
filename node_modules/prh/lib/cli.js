"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var path = require("path");
var fs = require("fs");
var yaml = require("js-yaml");
var diff = require("diff");
var _1 = require("./");
var content_1 = require("./utils/content");
var commandpost = require("commandpost");
var pkg = require("../package.json");
var root = commandpost
    .create("prh [files...]")
    .version(pkg.version, "-v, --version")
    .option("--rules-json", "emit rule set in json format")
    .option("--rules-yaml", "emit rule set in yaml format")
    .option("--rules <path>", "path to rule yaml file")
    .option("--verify", "checking file validity")
    .option("--stdout", "print replaced content to stdout")
    .option("--diff", "show unified diff")
    .option("--verbose", "makes output more verbose")
    .option("-r, --replace", "replace input files")
    .action(function (opts, args) {
    if (opts.rulesJson || opts.rulesYaml) {
        if (opts.verbose) {
            console.warn("processing " + process.cwd() + " dir...");
        }
        var engine = getEngineByTargetDir(process.cwd());
        if (opts.rulesJson) {
            console.log(JSON.stringify(engine, null, 2));
            return;
        }
        else if (opts.rulesYaml) {
            console.log(yaml.dump(JSON.parse(JSON.stringify(engine, null, 2))));
            return;
        }
    }
    if (args.files.length === 0) {
        throw new Error("files is required more than 1 argument");
    }
    var invalidFiles = [];
    args.files.forEach(function (filePath) {
        if (opts.verbose) {
            console.warn("processing " + filePath + "...");
        }
        var content = fs.readFileSync(filePath, { encoding: "utf8" });
        var engine = getEngineByTargetDir(path.dirname(filePath));
        var changeSet = engine.makeChangeSet(filePath);
        if (changeSet.diffs.length !== 0) {
            invalidFiles.push(filePath);
        }
        if (opts.stdout) {
            var result = changeSet.applyChangeSets(content);
            process.stdout.write(result);
        }
        else if (opts.diff) {
            var result = changeSet.applyChangeSets(content);
            var patch = diff.createPatch(filePath, content, result, "before", "replaced");
            console.log(patch);
        }
        else if (opts.replace) {
            var result = changeSet.applyChangeSets(content);
            if (content !== result) {
                fs.writeFileSync(filePath, result);
                console.warn("replaced " + filePath);
            }
        }
        else {
            changeSet.diffs.forEach(function (diff) {
                var before = changeSet.content.substr(diff.index, diff.tailIndex - diff.index);
                var after = diff.newText;
                if (after == null) {
                    return;
                }
                var lineColumn = content_1.indexToLineColumn(diff.index, changeSet.content);
                console.log(changeSet.filePath + "(" + (lineColumn.line + 1) + "," + (lineColumn.column + 1) + "): " + before + " \u2192 " + after);
            });
        }
    });
    if (opts.verify && invalidFiles.length !== 0) {
        throw new Error(invalidFiles.join(" ,") + " failed proofreading");
    }
    function getEngineByTargetDir(targetDir) {
        var rulePaths;
        if (opts.rules && opts.rules[0]) {
            rulePaths = opts.rules.slice();
        }
        else {
            var foundPath = _1.getRuleFilePath(targetDir);
            if (!foundPath) {
                throw new Error("can't find rule file from " + targetDir);
            }
            rulePaths = [foundPath];
        }
        if (opts.verbose) {
            rulePaths.forEach(function (path, i) {
                console.warn("  apply " + (i + 1) + ": " + path);
            });
        }
        return _1.fromYAMLFilePaths.apply(void 0, rulePaths);
    }
});
root
    .subCommand("init")
    .description("generate prh.yml")
    .action(function (_opts, _args) {
    fs.createReadStream(path.resolve(__dirname, "../misc/prh.yml")).pipe(fs.createWriteStream("prh.yml"));
    console.log("create prh.yml");
    console.log("see prh/rules collection https://github.com/prh/rules");
});
commandpost
    .exec(root, process.argv)
    .catch(errorHandler);
function errorHandler(err) {
    if (err instanceof Error) {
        console.error(err.stack);
    }
    else {
        console.error(err);
    }
    return Promise.resolve(null).then(function () {
        process.exit(1);
    });
}
//# sourceMappingURL=cli.js.map