// entry.js NOT_MINIFIED

var submodule = require('./submodule')
  , jsonthing = require('./jsonthing.json')
  , myString
  , actual
  , expected;

myString = submodule.createString(function () {
  var mathy = 1 + 1 + 2 + 3 + 5 + 8;

  mathy *= 1337;

  return 'potato #' + mathy + jsonthing.turkey;
});

actual = document.createElement('pre');
expected = document.createElement('pre');

actual.innerHTML   = 'Actual:   ' + myString;
expected.innerHTML = 'Expected: Wed Dec 31 1969 22:30:23 GMT-0800 (PST) friedpotato #26740salmonbakedpotato #26740salmonsliced potato #26740salmon';

document.body.appendChild(actual);
document.body.appendChild(expected);
