"use strict";
function notifyMessageAsPromise(message, options) {
    return new Promise(function (resolve, reject) {
        if (Notification && Notification.permission === "granted") {
            var notification = new Notification(message, options);
            resolve(notification);
        } else if (Notification) {
            Notification.requestPermission(function (status) {
                if (Notification.permission !== status) {
                    Notification.permission = status;
                }
                if (status === "granted") {
                    var notification = new Notification(message, options);
                    return resolve(notification);
                } else {
                    reject(new Error("user denied"));
                }
            });
        } else {
            reject(new Error("doesn't support Notification API"));
        }
    });
}
module.exports.notifyMessageAsPromise = notifyMessageAsPromise;