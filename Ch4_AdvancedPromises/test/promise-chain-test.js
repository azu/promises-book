"use strict";
var Room = require("../src/promise-chain").Room;
describe("promise-chain ", function () {
    it("available as chain", function () {
        var room = new Room("west");
        var a = room.open();
        console.log(a.toSource());
    });
});