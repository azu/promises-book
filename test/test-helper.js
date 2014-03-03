/**
 * Created by azu on 2014/03/02.
 * LICENSE : MIT
 */
"use strict";
if (!global.Promise) {
    global.Promise = require("ypromise");
}
if (global.mocha) {
    global.mocha.checkLeaks = false;
}
