"use strict";
function notifyMessage(message, options, callback) {
    if (Notification && Notification.permission === "granted") {
        var notification = new Notification(message, options);
        callback(null, notification);
    } else if (Notification.requestPermission) {
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
    } else {
        callback(new Error("doesn't support Notification API"));
    }
}

module.exports.notifyMessage = notifyMessage;