var vm = require('vm');

// ParentElement is only used in the browser but we want to came the same
// interface.
function Context(sandbox, parentElement) {
  this.context = vm.createContext(sandbox || {});
}

Context.prototype.evaluate = function (code) {
  return vm.runInContext(code, this.context);
};

Context.prototype.destroy = function () {
  this.context = null;
};

Context.prototype.getGlobal = function () {
  return this.context;
};

Context.prototype.extend = function (obj) {
  Object.keys(obj).forEach(function(key) {
    this.context[key] = obj[key];
  }, this);
};

module.exports = Context;
