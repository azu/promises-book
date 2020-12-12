'use strict';
module.exports = /* intentional newline */
  function () {
  function PowerAssertRecorder() {
    this.captured = [];
  }

  PowerAssertRecorder.prototype._capt = function _capt (value, espath) {
    this.captured.push({value: value, espath: espath});
    return value;
  };

  PowerAssertRecorder.prototype._expr = function _expr (value, source) {
    var capturedValues = this.captured;
    this.captured = [];
    return {
      powerAssertContext: {
        value: value,
        events: capturedValues
      },
      source: source
    };
  };

  return PowerAssertRecorder;
}
