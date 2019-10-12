"use strict";
const onReadyPromise = require("../../lib/onReady-promise").onReadyPromise;
onReadyPromise().then(() => {
    console.log("DOM fully loaded and parsed");
});
console.log("==Starting==");