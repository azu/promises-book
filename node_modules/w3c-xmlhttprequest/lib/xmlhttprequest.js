/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2011-2017 Yamagishi Kazutoshi
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the 'Software'), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

const http = require('http');
const constants = require('./constants');
const Event = require('./event');
const FormData = require('./formdata');
const ProgressEvent = require('./progressevent');
const utils = require('./utils');
const XMLHttpRequestEventTarget = require('./xmlhttprequesteventtarget');
const XMLHttpRequestUpload = require('./xmlhttprequestupload');

const HTTP_STATUS_CODES = http.STATUS_CODES;
const OVERRIDE_PROTECTION_DESCRIPTOR = constants.OVERRIDE_PROTECTION_DESCRIPTOR;
const FORBIDDEN_REQUEST_HEADERS = [
  'Accept-Charset',
  'Accept-Encoding',
  'Access-Control-Request-Headers',
  'Access-Control-Request-Method',
  'Connection',
  'Content-Length',
  'Cookie',
  'Cookie2',
  'Date',
  'DNT',
  'Expect',
  'Host',
  'Keep-Alive',
  'Origin',
  'Referer',
  'TE',
  'Trailer',
  'Transfer-Encoding',
  'Upgrade',
  'User-Agent',
  'Via',
  'Sec-.*',
  'Proxy-.*'
];
const FORBIDDEN_REQUEST_HEADERS_PATTERN = new RegExp(
  `^(${FORBIDDEN_REQUEST_HEADERS.join('|')})$`);

const XMLHttpRequestResponseType = [
  '',
  'arraybuffer',
  'blob',
  'document',
  'json',
  'text'
];

function _readyStateChange(readyState) {
  const readyStateChangeEvent = new Event('');
  readyStateChangeEvent.initEvent('readystatechange', false, false);
  Object.defineProperty(this, 'readyState', Object.assign(
    {}, OVERRIDE_PROTECTION_DESCRIPTOR, { value: readyState }));
  this.dispatchEvent(readyStateChangeEvent);
}

function _receiveResponse(response) {
  const _properties = this._properties;
  const statusCode = response.statusCode;
  Object.defineProperties(this, {
    status: Object.assign({}, OVERRIDE_PROTECTION_DESCRIPTOR, {
      value: statusCode
    }),
    statusText: Object.assign({}, OVERRIDE_PROTECTION_DESCRIPTOR, {
      value: HTTP_STATUS_CODES[statusCode]
    })
  });
  _properties.responseHeaders = response.headers;
  const contentLength = response.headers['content-length'] || '0';
  const bufferLength = parseInt(contentLength, 10);
  if (bufferLength !== 0) {
    _properties.lengthComputable = true;
    _properties.loaded = 0;
    _properties.total = bufferLength;
  }
  _properties.responseBuffer = new Buffer(bufferLength);
  _readyStateChange.call(this, XMLHttpRequest.LOADING);
  let byteOffset = 0;
  response.addListener('data', (chunk) => {
    if (bufferLength === 0) {
      const buffer = this._properties.responseBuffer;
      this._properties.responseBuffer = new Buffer(
        buffer.length + chunk.length);
      buffer.copy(this._properties.responseBuffer);
    }
    chunk.copy(this._properties.responseBuffer, byteOffset);
    byteOffset += chunk.length;
    this.loaded = byteOffset;
    _readyStateChange.call(this, XMLHttpRequest.LOADING);
  });
  response.addListener('end', () => {
    _readyStateChange.call(this, XMLHttpRequest.DONE);
    _properties.client = null;
  });
}

function _setDispatchProgressEvents(stream) {
  const _properties = this._properties || {};
  const loadStartEvent = new ProgressEvent('loadstart');
  this.dispatchEvent(loadStartEvent);
  stream.on('data', () => {
    const progressEvent = new ProgressEvent('progress', {
      lengthComputable: _properties.lengthComputable || 0,
      loaded: _properties.loaded || 0,
      total: _properties.total || 0
    });
    this.dispatchEvent(progressEvent);
  });
  stream.on('end', () => {
    const loadEvent = new ProgressEvent('load');
    const loadEndEvent = new ProgressEvent('loadend');
    this.dispatchEvent(loadEvent);
    this.dispatchEvent(loadEndEvent);
  });
}

class XMLHttpRequest extends XMLHttpRequestEventTarget {
  constructor(options) {
    super();
    options = options || {};
    this._flag.anonymous = !!options.anon;
    Object.defineProperties(this, {
      upload: Object.assign({}, OVERRIDE_PROTECTION_DESCRIPTOR, {
        value: new XMLHttpRequestUpload()
      }),
      _properties: {
        configurable: false,
        enumerable: false,
        value: Object.create(Object.prototype, {
          auth: {
            configurable: false,
            enumerable: true,
            value: '',
            writable: true
          },
          client: {
            configurable: false,
            enumerable: true,
            value: null,
            writable: true
          },
          lengthComputable: {
            configurable: false,
            enumerable: true,
            value: false,
            writable: true
          },
          loaded: {
            configurable: false,
            enumerable: true,
            value: 0,
            writable: true
          },
          method: {
            configurable: false,
            enumerable: true,
            value: 'get',
            writable: true
          },
          responseHeaders: {
            configurable: false,
            enumerable: true,
            value: {},
            writable: true
          },
          responseBuffer: {
            configurable: false,
            enumerable: true,
            value: null,
            writable: true
          },
          responseType: {
            configurable: false,
            enumerable: true,
            value: '',
            writable: true
          },
          requestHeaders: {
            configurable: false,
            enumerable: true,
            value: {},
            writable: true
          },
          total: {
            configurable: false,
            enumerable: true,
            value: {},
            writable: true
          },
          uri: {
            configurable: true,
            enumerable: true,
            value: '',
            writable: true
          }
        }),
        writable: false
      }
    });
  }

  get responseType() {
    const responseType = this._properties.responseType;
    if (XMLHttpRequestResponseType.indexOf(responseType) < 0) {
      return '';
    }
    return responseType;
  }

  set responseType(responseType) {
    if (XMLHttpRequestResponseType.indexOf(responseType) < 0) {
      throw new Error(''); // todo
    }
    this._properties.responseType = responseType;
    return responseType;
  }

  get response() {
    const responseBuffer = this._properties.responseBuffer;
    if (!(responseBuffer instanceof Buffer)) {
      return '';
    }
    switch (this.responseType) {
      case '':
        return this.responseText;
      case 'arraybuffer':
      case 'blob':
        return (new Uint8Array(responseBuffer)).buffer;
      case 'document':
        return null; // todo
      case 'json':
        return JSON.parse(this.responseText);
      case 'text':
        return this.responseText;
      default:
        return '';
    }
  }

  get responseText() {
    const responseBuffer = this._properties.responseBuffer;
    if (!(responseBuffer instanceof Buffer)) {
      return '';
    }
    return responseBuffer.toString();
  }

  abort() {
    const client = this._properties.client;
    if (client && typeof client.abort === 'function') {
      client.abort();
    }
    this.dispatchEvent(new ProgressEvent('abort'));
    this.upload.dispatchEvent(new ProgressEvent('abort'));
  }

  getAllResponseHeaders() {
    const readyState = this.readyState;
    if ([XMLHttpRequest.UNSENT, XMLHttpRequest.OPENED].indexOf(readyState) >= 0) {
      throw new Error(''); // todo
    }
    const responseHeaders = this._properties.responseHeaders;
    return Object.keys(responseHeaders).map((key) => {
      const value = responseHeaders[key];
      return [key, value].join(': ');
    }).join('\n');
  }

  getResponseHeader(header) {
    const readyState = this.readyState;
    if ([XMLHttpRequest.UNSENT, XMLHttpRequest.OPENED].indexOf(readyState) >= 0) {
      throw new Error(''); // todo;
    }
    const key = header.toLowerCase();
    const value = this._properties.responseHeaders[key];
    return typeof value !== 'undefined' ? '' + value : null;
  }

  open(method, uri, async, user, password) {
    const argumentCount = arguments.length;
    if (argumentCount < 2) {
      throw new TypeError('Not enought arguments');
    }
    this._properties.method = method;
    this._properties.uri = uri;
    this._flag.synchronous = !!async;
    if (argumentCount >= 4) {
      this._properties.auth = [
        user || '',
        password || ''
      ].join(':');
    }
    _readyStateChange.call(this, XMLHttpRequest.OPENED);
  }

  overrideMimeType(/* mime */) {
    // todo
  }

  send(body) {
    const _properties = this._properties;
    if (this.readyState !== XMLHttpRequest.OPENED) {
      throw new Error(); // todo
    }
    const async = this._flag.synchronous;
    const client = utils.createClient(this._properties, async, (response) => {
      _setDispatchProgressEvents.call(this, response);
      _receiveResponse.call(this, response);
    });
    _properties.client = client;
    Object.keys(_properties.requestHeaders).forEach(function(key) {
      var value = _properties.requestHeaders[key];
      client.setHeader(key, value);
    });
    _readyStateChange.call(this, XMLHttpRequest.HEADERS_RECEIVED);
    if (typeof body === 'string' || body instanceof FormData) {
      client.on('socket', _setDispatchProgressEvents.bind(this.upload));
      client.write(body);
    }
    client.end();
  }

  setRequestHeader(header, value) {
    if (this.readyState === XMLHttpRequest.UNSENT) {
      throw new Error(''); // todo
    }
    if (FORBIDDEN_REQUEST_HEADERS_PATTERN.test(header)) {
      return;
    }
    this._properties.requestHeaders[header] = value;
  }
}

(function() {
  const xmlHttpRequestConstants = {
    UNSENT: {
      configurable: false,
      enumerable: true,
      value: 0,
      writable: false
    },
    OPENED: {
      configurable: false,
      enumerable: true,
      value: 1,
      writable: false
    },
    HEADERS_RECEIVED: {
      configurable: false,
      enumerable: true,
      value: 2,
      writable: false
    },
    LOADING: {
      configurable: false,
      enumerable: true,
      value: 3,
      writable: false
    },
    DONE: {
      configurable: false,
      enumerable: true,
      value: 4,
      writable: false
    }
  };
  const props = {
    _flag: {
      configurable: false,
      enumerable: false,
      value: Object.create(Object.prototype, {
        anonymous: {
          configurable: false,
          enumerable: true,
          value: false,
          writable: true
        },
        synchronous: {
          configurable: false,
          enumerable: true,
          value: false,
          writable: true
        },
        uploadComplete: {
          configurable: false,
          enumerable: true,
          value: false,
          writable: true
        },
        uploadEvents: {
          configurable: false,
          enumerable: true,
          value: false,
          writable: true
        }
      }),
      writable: false
    },
    readyState: Object.assign({}, OVERRIDE_PROTECTION_DESCRIPTOR, {
      value: XMLHttpRequest.UNSENT
    }),
    responseXML: Object.assign({}, OVERRIDE_PROTECTION_DESCRIPTOR, {
      value: null // todo
    }),
    status: Object.assign({}, OVERRIDE_PROTECTION_DESCRIPTOR, {
      value: 0
    }),
    statusText: Object.assign({}, OVERRIDE_PROTECTION_DESCRIPTOR, {
      value: ''
    }),
    timeout: Object.assign({}, OVERRIDE_PROTECTION_DESCRIPTOR, {
      value: 0
    }),
    upload: Object.assign({}, OVERRIDE_PROTECTION_DESCRIPTOR, {
      value: null
    }),
    withCredentials: {
      value: false,
      writable: true
    }
  };
  Object.defineProperties(XMLHttpRequest, xmlHttpRequestConstants);
  Object.defineProperties(XMLHttpRequest.prototype, Object.assign(
    {}, xmlHttpRequestConstants, props));
})();

module.exports = XMLHttpRequest;
