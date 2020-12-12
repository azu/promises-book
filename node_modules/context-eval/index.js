if (!(typeof window !== "undefined" && window !== null)) {
  // Will do this dance so the require isn't parsed for browserify etc.
  var moduleName = './lib/context-node';
  module.exports = require(moduleName);
} else {
  module.exports = require('./lib/context-browser');
}
