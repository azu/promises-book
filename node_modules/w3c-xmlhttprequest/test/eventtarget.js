/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2013-2017 Yamagishi Kazutoshi
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

const assert = require('assert');
const Event = require('../lib/event');
const EventTarget = require('../lib/eventtarget');

describe('EventTarget', function() {
  let Test;

  before(function() {
    Test = class extends EventTarget {
    };
  });

  it('can be inherited', function() {
    const test = new Test();
    assert.ok(test instanceof EventTarget);
    assert.strictEqual(typeof test.addEventListener, 'function');
  });

  it('.addEventListener()', function(done) {
    const test = new Test();
    const event = new Event('create');
    test.addEventListener('create', function() {
      assert.strictEqual(test, this);
      assert.strictEqual(event, arguments[0]);
      done();
    }, false);
    test.dispatchEvent(event);
  });

  it('.removeEventListener()', function() {
    const test = new Test();
    const event = new Event('create');
    function eventListener() {
      throw new TypeError('Event listener is not remove.');
    }
    test.addEventListener('create', eventListener, false);
    test.removeEventListener('create', eventListener, false);
    test.dispatchEvent(event);
  });
});
