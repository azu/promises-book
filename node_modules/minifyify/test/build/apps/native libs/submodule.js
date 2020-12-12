var createString = function (cb) {
  var buff = [];

  for(var i=0, ii=3; i<ii; i++) {
    buff.push(cb());
  }

  return buff.join();
};

module.exports = {
  createString: createString
};
