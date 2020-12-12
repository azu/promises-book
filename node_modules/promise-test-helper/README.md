# promise-test-helper [![Build Status](https://travis-ci.org/azu/promise-test-helper.svg)](https://travis-ci.org/azu/promise-test-helper)

`promise-test-helper` is library for promise testing.

This library help you avoid promise traps on testing.

* [Making Change.org — Promises and Error Handling](http://making.change.org/post/69613524472/promises-and-error-handling "Making Change.org — Promises and Error Handling")
* [Promise Anti-patterns](http://taoofcode.net/promise-anti-patterns/ "Promise Anti-patterns")
* [Promisesのテスト - Promises Book](http://azu.github.io/promises-book/#_chapter_3_promises "Promises Book") (Japanese)

### Trap case:

You expected to `mayBeRejected()` is rejected, but it is resolved.

The result was **always passed**. (Unexpected!)

```js
function mayBeRejected(){
    return Promise.resolve();
}
it("is bad pattern", function () {
    return mayBeRejected().catch(function (error) {
        assert(error instanceof Error);
    });
});
```

You can write intended test with `promise-test-helper`.

The result was **Fail**. Yes go as expected!

```js
var shouldRejected = require("promise-test-helper").shouldRejected;
function mayBeRejected(){
    return Promise.resolve();
}
it("should be failed", function () {
    return shouldRejected(mayBeRejected()).catch(function (error) {
        assert(error instanceof Error);
    });
});
```

## Installation

``` sh
npm install --save-dev promise-test-helper
```

I'd recommend use with [Mocha](http://visionmedia.github.io/mocha/ "Mocha") or [Buster.JS](http://docs.busterjs.org/en/latest/ "Buster.JS") - support promise testing.


## Usage

This library provide two methods.

``` js
var shouldFulfilled = require("promise-test-helper").shouldFulfilled;
var shouldRejected = require("promise-test-helper").shouldRejected;
// in test code
shouldFulfilled(aPromise).then(function(){ /* assert */ });
shouldRejected(aPromise).catch(function(){ /* assert */ });
```

Example :

``` js
"use strict";
var assert = require("assert");
var Promise = require("ypromise");
var shouldFulfilled = require("../lib/promise-test-helper").shouldFulfilled;
var shouldRejected = require("../lib/promise-test-helper").shouldRejected;
describe("promise-test-helper", function () {
    beforeEach(function () {
        this.fulfilledPromise = Promise.resolve("value");
        this.rejectedPromise = Promise.reject(new Error("error"));
    });
    describe("Passing good test", function () {
        context("when promise is fulfilled", function () {
            it("should be passed", function () {
                return shouldFulfilled(this.fulfilledPromise).then(function (value) {
                    assert(value === "value");
                })
            });
        });
        context("when promise is rejected", function () {
            it("should be passed", function () {
                return shouldRejected(this.rejectedPromise).catch(function (error) {
                    assert(error instanceof Error);
                });
            });
        });
    });
});
```

You can avoid following wrong test by using these method :

(following tests are failed.)

```js
// == Bad test pattern
describe("Detect bad test pattern", function () {
    context("when argument is not promise", function () {
        it("should be failed", function () {
            return shouldFulfilled("string");// is not a promise object
        });
    });
    context("when promise is rejected", function () {
        it("should be failed", function () {
            return shouldFulfilled(this.rejectedPromise).catch(function (error) {
                assert(error);// expect to fulfilled?
            });
        });
    });
    context("when argument is not promise", function () {
        it("should be failed", function () {
            return shouldRejected("string");// is not a promise object
        });
    });
    context("when promise is fulfilled", function () {
        it("should be failed", function () {
            return shouldRejected(this.fulfilledPromise).then(function (value) {
                assert(value);// expect to rejected?
            });
        });
    });
});
```


This library inspired by [domenic/chai-as-promised](https://github.com/domenic/chai-as-promised "domenic/chai-as-promised").

## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## License

MIT