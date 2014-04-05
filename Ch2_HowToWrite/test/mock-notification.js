/**
 * Created by azu on 2014/04/06.
 * LICENSE : MIT
 */
"use strict";
function MockNotification(title, options) {
    this.title = title;
    this.mEvents = {};
}
MockNotification.prototype.permission = "default";
MockNotification.prototype.addEventListener = function mockNotification_addEventListener(evt, callback) {
    this.mEvents[evt] = callback;
};
module.exports.MockNotification = MockNotification;