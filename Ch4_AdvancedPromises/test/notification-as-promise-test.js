/**
 * Created by azu on 2014/04/06.
 * LICENSE : MIT
 */
"use strict";
const assert = require("power-assert");
const notifyMessage = require("../src/notifications/notification-as-promise").notifyMessageAsPromise;
const MockNotification = require("./mock/mock-notification").MockNotification;
describe("notification-as-promise", () => {
    beforeEach(() => {
        global.Notification = MockNotification;
    });
    afterEach(() => {
        delete global.Notification;
    });
    context("when already allowed permission", () => {
        before(() => {
            MockNotification.permission = "granted";
        });
        after(() => {
            delete MockNotification.permission;
        });
        it("should return Notification", () => {
            return shouldFulfilled(notifyMessage("message")).then((notification) => {
                assert(notification instanceof MockNotification);
            });
        });
    });
    context("when user allow permission", () => {
        before(() => {
            MockNotification.requestPermission = function(callback) {
                callback("granted");
            };
        });
        after(() => {
            delete MockNotification.permission;
            delete MockNotification.requestPermission;
        });
        it("should return Notification", () => {
            return shouldFulfilled(notifyMessage("message")).then((notification) => {
                assert(notification instanceof MockNotification);
            });
        });
    });

    context("when user deny permission", () => {
        before(() => {
            MockNotification.requestPermission = function(callback) {
                callback("denied");
            };
        });
        after(() => {
            delete MockNotification.permission;
            delete MockNotification.requestPermission;
        });
        it("should return Notification", () => {
            return shouldRejected(notifyMessage("message")).catch((error) => {
                assert(error instanceof Error);
                assert(error.message === "user denied");
            });
        });
    });
});