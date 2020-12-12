'use strict';

const fs = require('fs');

// Remove README.md and restore hidden README.adoc
fs.unlink('README.md', (unlinkErr) => {
  if (unlinkErr) throw unlinkErr;
});
fs.rename('.README.adoc', 'README.adoc', (renameErr) => {
  if (renameErr) throw renameErr;
});
