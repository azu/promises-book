"use strict";
var copyOwnFrom = require("./copyOwnFrom").copyOwnFrom;
function TimeoutError() {
    var superInstance = Error.apply(null, arguments);
    copyOwnFrom(this, superInstance);
}
TimeoutError.prototype = Object.create(Error.prototype);
TimeoutError.prototype.constructor = TimeoutError;
module.exports.TimeoutError = TimeoutError;