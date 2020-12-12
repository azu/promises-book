// submodule.js NOT_MINIFIED

var subsubmodule = require('../dirB/subsubmodule');

module.exports = {
  createString: function (mathFunction) {
    var date
      , someNumber;

    date = subsubmodule.getTheDate(function () {
      var potatoes;

      potatoes = ['fried', 'baked', 'sliced'];

      return potatoes.join(mathFunction());
    });

    someNumber = mathFunction();

    return date + ' ' + someNumber;
  }
};
