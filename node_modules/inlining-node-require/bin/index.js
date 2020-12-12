#!/usr/bin/env node

var exitCode = require("../lib/cli")(process.argv);
process.exit(exitCode);