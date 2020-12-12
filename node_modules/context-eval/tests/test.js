var Context = require('../');
var assert = require('assert');

describe('Context', function () {

  describe('#evaluate', function () {

    var context;
    afterEach(function () {
      context.destroy();
    });

    if (typeof document !== 'undefined') {
      it('should append iframe to parent', function () {
        var div = document.createElement('div');
        context = new Context(null, div);
        assert.strictEqual(div.childNodes[0], context.iframe);
      });
    }

    it('should evaluate code', function () {
      context = new Context();
      assert.equal(context.evaluate('1 + 1'), 2);
    });

    it('should persist', function () {
      context = new Context();
      context.evaluate('var x = 1');
      assert.equal(context.evaluate('x'), 1);
    });

    it('should pass in sandbox', function () {
      var foo = { bar : 1 };
      context = new Context({ foo: foo });
      assert(foo === context.evaluate('foo'));
    });
  });

  it('should destroy', function () {
    var context = new Context();
    context.destroy();
    if (typeof document !== 'undefined') {
      assert(!context.iframe);
      assert(!document.querySelector('iframe'));
    }
  });

});
