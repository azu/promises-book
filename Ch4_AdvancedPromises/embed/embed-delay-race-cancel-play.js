function copyOwnFrom(target, source) {
    Object.getOwnPropertyNames(source).forEach((propName) => {
        Object.defineProperty(target, propName,
            Object.getOwnPropertyDescriptor(source, propName));
    });
    return target;
}
function TimeoutError() {
    const superInstance = Error.apply(null, arguments);
    copyOwnFrom(this, superInstance);
}
TimeoutError.prototype = Object.create(Error.prototype);
TimeoutError.prototype.constructor = TimeoutError;
function delayPromise(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
function timeoutPromise(promise, ms) {
    const timeout = delayPromise(ms).then(() => {
        return Promise.reject(new TimeoutError("Operation timed out after " + ms + " ms"));
    });
    return Promise.race([promise, timeout]);
}
function copyOwnFrom(target, source) {
    Object.getOwnPropertyNames(source).forEach((propName) => {
        Object.defineProperty(target, propName,
            Object.getOwnPropertyDescriptor(source, propName));
    });
    return target;
}
function TimeoutError() {
    const superInstance = Error.apply(null, arguments);
    copyOwnFrom(this, superInstance);
}
TimeoutError.prototype = Object.create(Error.prototype);
TimeoutError.prototype.constructor = TimeoutError;

function cancelableXHR(URL) {
    const req = new XMLHttpRequest();
    const promise = new Promise((resolve, reject) => {
        req.open("GET", URL, true);
        req.onload = () => {
            if (200 <= req.status && req.status < 300) {
                resolve(req.responseText);
            } else {
                reject(new Error(req.statusText));
            }
        };
        req.onerror = () => {
            reject(new Error(req.statusText));
        };
        req.onabort = function() {
            reject(new Error("this request is aborted"));
        };
        req.send();
    });
    const abort = function() {
        // 既にrequestが止まってなければabortする
        // https://developer.mozilla.org/en/docs/Web/API/XMLHttpRequest/Using_XMLHttpRequest
        if (req.readyState !== XMLHttpRequest.UNSENT) {
            req.abort();
        }
    };
    return {
        promise: promise,
        abort: abort
    };
}
const object = cancelableXHR("https://httpbin.org/get");
// main
timeoutPromise(object.promise, 1000)
    .then((contents) => {
        console.log("Contents", contents);
    }).
    catch((error) => {
        if (error instanceof TimeoutError) {
            object.abort();
            console.error(error);
            return;
        }
        console.log("XHR Error :", error);
    });
