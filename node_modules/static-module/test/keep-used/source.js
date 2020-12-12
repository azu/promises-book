var insertCSS = require('insert-css');

insertCSS('.a { color: red }');
// can't replace this
insertCSS(window.__style);
