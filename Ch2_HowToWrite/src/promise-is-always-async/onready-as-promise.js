"use strict";
var onReadyPromise = require("../../lib/onReady-promise").onReadyPromise;
onReadyPromise().then(function () {
    console.log("DOM fully loaded and parsed");
});
console.log("==Starting==");