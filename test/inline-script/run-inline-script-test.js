/**
 * Created by azu on 2014/05/25.
 * LICENSE : MIT
 */
"use strict";
var checkInlineScript = require("./inline-script-tester").checkInlineScript;
checkInlineScript("../../").catch(function (error) {
    if(error) {
        console.error(error);
    }
});