/**
 * Created by azu on 2014/03/02.
 * LICENSE : MIT
 */
"use strict";
// Polyfill
global.Promise = require("ypromise");
global.XMLHttpRequest = require('w3c-xmlhttprequest').XMLHttpRequest;