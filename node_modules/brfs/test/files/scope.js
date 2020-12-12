var fs = require('fs');
var path = require('path');
var dynamicallyCreatedFilename = path.join('/files/', 'somefile');
fs.readFileSync(__dirname + dynamicallyCreatedFilename + __dirname, 'utf8');
function x (fs) {
    fs.readFileSync('doesNotExist')
}
fs.readFileSync(__dirname + '/scope-sentinel')
require('fs').readFileSync(__dirname + '/scope-sentinel')
