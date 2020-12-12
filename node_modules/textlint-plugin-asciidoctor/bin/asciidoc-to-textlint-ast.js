#!/usr/bin/env node
"use strict";

var parse = require("../lib/parse").default,
  stdin = process.stdin,
  stdout = process.stdout,
  inputChunks = [];

stdin.resume();
stdin.setEncoding("utf8");

stdin.on("data", function(chunk) {
  inputChunks.push(chunk);
});

stdin.on("end", function() {
  var input = inputChunks.join(),
    parsed = parse(input),
    output = JSON.stringify(parsed);
  stdout.write(output);
  stdout.write("\n");
});
