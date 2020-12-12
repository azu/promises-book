function Context(sandbox, parentElement) {
  this.iframe = document.createElement('iframe');
  this.iframe.style.display = 'none';
  parentElement = parentElement || document.body;
  parentElement.appendChild(this.iframe);
  var win = this.iframe.contentWindow;
  if (sandbox) {
    this.extend(sandbox);
  }
}

Context.prototype.evaluate = function (code) {
  return this.iframe.contentWindow.eval(code);
};

Context.prototype.destroy = function () {
  if (this.iframe) {
    this.iframe.parentNode.removeChild(this.iframe);
    this.iframe = null;
  }
};

Context.prototype.getGlobal = function () {
  return this.iframe.contentWindow;
};

Context.prototype.extend = function (sandbox) {
  var global = this.getGlobal();
  Object.keys(sandbox).forEach(function (key) {
    global[key] = sandbox[key];
  });
};

module.exports = Context;
