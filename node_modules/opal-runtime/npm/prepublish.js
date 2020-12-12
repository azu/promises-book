'use strict'

var fs = require('fs')

if (!(String.prototype instanceof Function)) {
  String.prototype.repeat = function (count) {
    if (count < 1) return '';
    var result = '', pattern = this.valueOf();
    while (count > 1) {
      if (count & 1) result += pattern;
      count >>= 1, pattern += pattern;
    }
    return result + pattern;
  };
}

// Transform README.adoc into README.md and hide README.adoc
fs.readFile('README.adoc', 'utf8', (readErr, asciidoc) => {
  if (readErr) throw readErr;
  fs.rename('README.adoc', '.README.adoc', (renameErr) => {
    if (renameErr) throw renameErr;
  });
  var markdown = asciidoc
    .replace(/^=+(?= \w)/gm, function (m) { return '#'.repeat(m.length) })
    .replace(new RegExp('(https?:[^\\[]+)\\[(|.*?[^\\\\])\\]', 'g'), '[$2]($1)')
    .replace(new RegExp('ifdef::env-github\\[\\][^]+endif::\\[\\]', 'g'), '');
  fs.writeFile('README.md', markdown, function (writeErr) {
    if (writeErr) throw writeErr;
  });
});
