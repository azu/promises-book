/**
 * Created by azu on 2014/03/02.
 * LICENSE : MIT
 */
"use strict";
global.Promise = require("core-js-pure/features/promise");
global.shouldFulfilled = require("promise-test-helper").shouldFulfilled;
global.shouldRejected = require("promise-test-helper").shouldRejected;

if (global.mocha) {
    global.mocha.checkLeaks = false;
}
