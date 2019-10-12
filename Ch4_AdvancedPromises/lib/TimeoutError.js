"use strict";
const copyOwnFrom = require("./copyOwnFrom").copyOwnFrom;
function TimeoutError() {
    const superInstance = Error.apply(null, arguments);
    copyOwnFrom(this, superInstance);
}
TimeoutError.prototype = Object.create(Error.prototype);
TimeoutError.prototype.constructor = TimeoutError;
module.exports.TimeoutError = TimeoutError;