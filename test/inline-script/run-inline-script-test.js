/**
 * Created by azu on 2014/05/25.
 * LICENSE : MIT
 */
"use strict";
const checkInlineScript = require("./inline-script-tester").checkInlineScript;
checkInlineScript("../../").catch((error) => {
    if (error) {
        console.error(error);
    }
});