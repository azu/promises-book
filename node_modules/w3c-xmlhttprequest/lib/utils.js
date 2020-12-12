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

const http = require('http');
const https = require('https');
const uriParse = require('url').parse;

var utils = {};

utils.createClient = (function() {
  const defaultOptions = {
    agent: http.globalAgent,
    auth: '',
    host: 'localhost',
    method: 'GET',
    path: '/',
    port: 80,
    protocol: 'http:'
  };

  function optionsParse(options) {
    const newOptions = {};
    const parsedUriObj = uriParse(options.uri || '', false, true);
    for (const key in defaultOptions) {
      if (defaultOptions.hasOwnProperty(key)) {
        const value = parsedUriObj[key];
        newOptions[key] = value || defaultOptions[key];
      }
    }
    if (typeof options.method !== 'undefined') {
      newOptions.method = options.method;
    }
    if (newOptions.protocol === 'https:') {
      newOptions.agent = https.globalAgent;
      newOptions.port = 443;
    }
    if (typeof parsedUriObj.hostname !== 'undefined') {
      newOptions.host = parsedUriObj.hostname;
    }
    return newOptions;
  }

  function createClient(options, async, callback) {
    options = optionsParse(options || {});
    const client = new http.ClientRequest(options, callback);
    return client;
  }

  return createClient;
})();

module.exports = utils;
