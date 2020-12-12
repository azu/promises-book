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

const constants = require('./constants');

const OVERRIDE_PROTECTION_DESCRIPTOR = constants.OVERRIDE_PROTECTION_DESCRIPTOR;

const eventConstants = {
  NONE: {
    configurable: false,
    enumerable: true,
    value: 0,
    writable: false
  },
  CAPTURING_PHASE: {
    configurable: false,
    enumerable: true,
    value: 1,
    writable: false
  },
  AT_TARGET: {
    configurable: false,
    enumerable: true,
    value: 2,
    writable: false
  },
  BUBBLING_PHASE: {
    configurable: false,
    enumerable: true,
    value: 3,
    writable: false
  }
};

const defaultDescriptor = {
  configurable: false,
  enumerable: true,
  value: false,
  writable: true
};

const _flagProps = {
  canceled: defaultDescriptor,
  dispatch: defaultDescriptor,
  initialized: defaultDescriptor,
  stopImmediatePropagation: defaultDescriptor,
  stopPropagation: defaultDescriptor
};

const props = {
  bubbles: OVERRIDE_PROTECTION_DESCRIPTOR,
  cancelable: OVERRIDE_PROTECTION_DESCRIPTOR,
  currentTarget: Object.assign({}, OVERRIDE_PROTECTION_DESCRIPTOR, {
    value: null
  }),
  eventPhase: Object.assign({}, OVERRIDE_PROTECTION_DESCRIPTOR, {
    value: eventConstants.NONE
  }),
  isTrusted: OVERRIDE_PROTECTION_DESCRIPTOR,
  target: Object.assign({}, OVERRIDE_PROTECTION_DESCRIPTOR, {
    value: null
  }),
  timeStamp: Object.assign({}, OVERRIDE_PROTECTION_DESCRIPTOR, {
    value: 0
  }),
  type: Object.assign({}, OVERRIDE_PROTECTION_DESCRIPTOR, {
    value: ''
  })
};

class Event {
  constructor(type) {
    if (arguments.length === 0) {
      throw new TypeError('Not enough arguments.');
    }
    const timeStampDescriptor = {};
    Object.assign(timeStampDescriptor, OVERRIDE_PROTECTION_DESCRIPTOR, {
      value: Date.now()
    });
    Object.defineProperty(this, 'timeStamp', timeStampDescriptor);
    Object.defineProperty(this, '_flag', {
      configurable: false,
      enumerable: false,
      value: Object.create({}, _flagProps),
      writable: false
    });
    Object.defineProperties(this, props);

    if (typeof type !== 'undefined') {
      this.initEvent(type);
    }
  }

  get defaultPrevented() {
    const eventFlag = this._flag;
    return !eventFlag.canceled;
  }

  initEvent(type, cancelable, bubbles) {
    var eventFlag = this._flag;
    eventFlag.initialized = true;
    if (!eventFlag.dispatch) {
      Object.defineProperties(this, {
        bubbles: Object.assign({}, OVERRIDE_PROTECTION_DESCRIPTOR, {
          value: !!bubbles
        }),
        cancelable: Object.assign({}, OVERRIDE_PROTECTION_DESCRIPTOR, {
          value: !!cancelable
        }),
        type: Object.assign({}, OVERRIDE_PROTECTION_DESCRIPTOR, {
          value: '' + type
        })
      });
    }
  }

  preventDefault() {
    const eventFlag = this._flag;
    if (this.cancelable && !eventFlag.canceled) {
      eventFlag.canceled = true;
    }
  }

  stopImmediatePropagation() {
    const eventFlag = this._flag;
    if (!eventFlag.stopImmediatePropagation) {
      this._flag.stopImmediatePropagation = true;
    }
  }

  stopPropagation() {
    const eventFlag = this._flag;
    if (!eventFlag.stopPropagation) {
      this._flag.stopPropagation = true;
    }
  }
}

(function() {
  Object.defineProperties(Event, eventConstants);
})();

module.exports = Event;
