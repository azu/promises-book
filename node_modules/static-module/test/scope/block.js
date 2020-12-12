var fs = require('fs');
{ // hello block scope
    let fs = { readFileSync: () => 'abc' }
    T.equal(fs.readFileSync(), 'abc')
}

T.equal( fs.readFileSync(), 'read the file!' )
