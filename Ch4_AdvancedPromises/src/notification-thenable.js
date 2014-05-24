"use strict";
var notifyMessage = require("./notification-callback").notifyMessage;
// `thenable` を返す
notifyMessage.thenable = function (message, options) {
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
};

module.exports.notifyMessage = notifyMessage;