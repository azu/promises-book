var submodule = require('./submodule')
  , path = require('path')
  , assert = require('assert')
  , myString
  , expectedString = 'highway/to/hell,highway/to/hell,highway/to/hell/stairway/to/heaven'
  , actual = document.createElement('pre')
  , expected = document.createElement('pre')
  , result = document.createElement('pre');

myString = submodule.createString(function () {
  return path.join('highway','to','hell');
});

myString = path.join(myString, 'stairway', 'to', 'heaven');

actual.innerHTML   = 'Actual:   ' + myString;
expected.innerHTML = 'Expected: ' + expectedString;

document.body.appendChild(actual);
document.body.appendChild(expected);

try {
  assert.strictEqual(myString, expectedString);
  result.innerHTML = 'Assertion Suceeded';
}
catch(e) {
  result.innerHTML = 'Assertion FAILED';
}

document.body.appendChild(result);
