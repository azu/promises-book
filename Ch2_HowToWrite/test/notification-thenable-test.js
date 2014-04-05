/**
 * Created by azu on 2014/04/06.
 * LICENSE : MIT
 */
"use strict";
var assert = require("power-assert");
var notifyMessage = require("../src/notification-thenable").notifyMessage;
var MockNotification = require("./mock-notification").MockNotification;
describe("notification-thenable", function () {
    beforeEach(function () {
        global.Notification = MockNotification;
    });
    afterEach(function () {
        delete global.Notification;
    });
    context("when already allowed permission", function () {
        before(function () {
            MockNotification.permission = "granted";
        });
        after(function () {
            delete MockNotification.permission;
        });
        it("should return Notification", function () {
            return Promise.resolve(notifyMessage.thenable("message")).then(function (notification) {
                assert(notification instanceof MockNotification);
            });
        });
    });
    context("when doesn't support Notification", function () {
        before(function () {
            global.Notification = null;
        });
        it("should catch error", function () {
            return Promise.resolve(notifyMessage.thenable("message")).then(function (notification) {
                assert.fail(":(");
            }).catch(function (error) {
                assert(error instanceof Error);
                assert(error.message === "doesn't support Notification API");
            });
        });
    });
    context("when user allow permission", function () {
        before(function () {
            MockNotification.requestPermission = function (callback) {
                callback("granted");
            };
        });
        after(function () {
            delete MockNotification.permission;
            delete MockNotification.requestPermission;
        });
        it("should return Notification", function () {
            return Promise.resolve(notifyMessage.thenable("message")).then(
                function (notification) {
                    assert(notification instanceof MockNotification);
                });
        });
    });

    context("when user deny permission", function () {
        before(function () {
            MockNotification.requestPermission = function (callback) {
                callback("denied");
            };
        });
        after(function () {
            delete MockNotification.permission;
            delete MockNotification.requestPermission;
        });
        it("should catch error", function () {
            return Promise.resolve(notifyMessage.thenable("message")).then(function (notification) {
                assert.fail(":(");
            }).catch(function (error) {
                assert(error instanceof Error);
                assert(error.message === "user denied");
            });
        });
    });
});