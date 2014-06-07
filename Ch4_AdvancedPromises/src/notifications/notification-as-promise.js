"use strict";
var notifyMessage = require("./notification-callback").notifyMessage;
function notifyMessageAsPromise(message, options) {
    return new Promise(function (resolve, reject) {
        notifyMessage(message, options, function (error, notification) {
            if (error) {
                reject(error);
            }else{
                resolve(notification);
            }
        })
    });
}
module.exports.notifyMessageAsPromise = notifyMessageAsPromise;