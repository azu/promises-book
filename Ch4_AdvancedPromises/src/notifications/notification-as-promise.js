"use strict";
const notifyMessage = require("./notification-callback").notifyMessage;
function notifyMessageAsPromise(message, options) {
    return new Promise((resolve, reject) => {
        notifyMessage(message, options, (error, notification) => {
            if (error) {
                reject(error);
            } else {
                resolve(notification);
            }
        });
    });
}
module.exports.notifyMessageAsPromise = notifyMessageAsPromise;
