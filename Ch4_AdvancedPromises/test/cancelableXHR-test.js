//"use strict";
//var assert = require("power-assert");
//var cancelableXHR = require("../lib/cancelableXHR");
//var TimeoutError = require("../lib/TimeoutError").TimeoutError;
//var timeoutPromise = require("../lib/timeoutPromise").timeoutPromise;
//var delayPromise = require("../lib/delayPromise").delayPromise;
//
//describe("cancelbaleXHR", function () {
//    context("when cancel promise", function () {
//        it("should be onRejected", function () {
//            var xhrPromise = cancelableXHR.createXHRPromise('http://httpbin.org/get');
//            cancelableXHR.abortPromise(xhrPromise);
//            return shouldRejected(xhrPromise).catch(function (error) {
//                assert(error instanceof TimeoutError);
//            });
//        });
//    });
//});