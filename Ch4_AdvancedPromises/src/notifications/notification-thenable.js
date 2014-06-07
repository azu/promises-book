"use strict";
var notifyMessage = require("./notification-callback").notifyMessage;
// `thenable` を返す
function notifyMessageAsThenable(message, options) {
    return {
        "then": function (resolve, reject) {
            notifyMessage(message, options, function (error, notification) {
                if (error) {
                    reject(error);
                } else {
                    resolve(notification);
                }
            });
        }
    };
}
module.exports.notifyMessageAsThenable = notifyMessageAsThenable;