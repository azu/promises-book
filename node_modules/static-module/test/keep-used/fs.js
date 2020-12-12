fs = require('fs'),

    console.log(fs.readFileSync(__filename)),
    console.log(fs.statSync(__filename).size)
