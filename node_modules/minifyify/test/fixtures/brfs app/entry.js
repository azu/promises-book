var fs = require('fs');

console.log(fs.readFileSync(__dirname + '/entry.js', {encoding: 'utf8'}));
