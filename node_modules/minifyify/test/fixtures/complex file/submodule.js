var subsubmodule = require('./subsubmodule');

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
