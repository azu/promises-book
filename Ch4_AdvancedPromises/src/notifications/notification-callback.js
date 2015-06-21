"use strict";
function notifyMessage(message, options, callback) {
    if (typeof Notification === "undefined") {
        callback(new Error("doesn't support Notification API"));
        return;
    }
    if (Notification.permission === "granted") {
        var notification = new Notification(message, options);
        callback(null, notification);
    } else {
        Notification.requestPermission(function (status) {
            if (Notification.permission !== status) {
                Notification.permission = status;
            }
            if (status === "granted") {
                var notification = new Notification(message, options);
                callback(null, notification);
            } else {
                callback(new Error("user denied"));
            }
        });
    }
}

module.exports.notifyMessage = notifyMessage;