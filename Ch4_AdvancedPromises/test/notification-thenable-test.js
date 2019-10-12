/**
 * Created by azu on 2014/04/06.
 * LICENSE : MIT
 */
"use strict";
const assert = require("power-assert");
const notifyMessageAsThenable = require("../src/notifications/notification-thenable").notifyMessageAsThenable;
const MockNotification = require("./mock/mock-notification").MockNotification;
describe("notification-thenable", () => {
    beforeEach(() => {
        global.Notification = MockNotification;
    });
    afterEach(() => {
        delete global.Notification;
    });
    context("when already allowed permission", () => {
        beforeEach(() => {
            MockNotification.permission = "granted";
        });
        afterEach(() => {
            delete MockNotification.permission;
        });
        it("should return Notification", () => {
            const promise = Promise.resolve(notifyMessageAsThenable("message"));
            return shouldFulfilled(promise).then((notification) => {
                assert(notification instanceof MockNotification);
            });
        });
    });
    context("when doesn't support Notification", () => {
        beforeEach(() => {
            global.Notification = undefined;
        });
        it("should catch error", () => {
            const promise = Promise.resolve(notifyMessageAsThenable("message"));
            return shouldRejected(promise).catch((error) => {
                assert(error instanceof Error);
                assert(error.message === "doesn't support Notification API");
            });
        });
    });
    context("when user allow permission", () => {
        beforeEach(() => {
            MockNotification.requestPermission = function(callback) {
                callback("granted");
            };
        });
        afterEach(() => {
            delete MockNotification.permission;
            delete MockNotification.requestPermission;
        });
        it("should return Notification", () => {
            const promise = Promise.resolve(notifyMessageAsThenable("message"));
            return shouldFulfilled(promise).then((notification) => {
                assert(notification instanceof MockNotification);
            });
        });
    });

    context("when user deny permission", () => {
        beforeEach(() => {
            MockNotification.requestPermission = function(callback) {
                callback("denied");
            };
        });
        afterEach(() => {
            delete MockNotification.permission;
            delete MockNotification.requestPermission;
        });
        it("should catch error", () => {
            const promise = Promise.resolve(notifyMessageAsThenable("message"));
            return shouldRejected(promise).catch((error) => {
                assert(error instanceof Error);
                assert(error.message === "user denied");
            });
        });
    });
});