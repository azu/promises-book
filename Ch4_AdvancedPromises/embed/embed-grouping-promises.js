
class Deferred {
    constructor() {
        this.promise = new Promise((resolve, reject) => {
            // Arrow Functionを利用しているため、`this`がDeferredのインスタンスを参照する
            this._resolve = resolve;
            this._reject = reject;
        });
    }

    // Deferred#resolveメソッドは、`value`でPromiseインスタンスをresolveする
    resolve(value) {
        this._resolve(value);
    }

    // Deferred#rejectメソッドは、`reason`でPromiseインスタンスをrejectする
    reject(reason) {
        this._reject(reason);
    }
}
function getXHRTimeout(URL) {
    const deferred = new Deferred();
    const req = new XMLHttpRequest();
    req.open("GET", URL, true);
    req.onload = () => {
        if (200 <= req.status && req.status < 300) {
            deferred.resolve(req.responseText);
        } else {
            deferred.reject(new Error(req.statusText));
        }
    };
    req.onerror = () => {
        deferred.reject(new Error(req.statusText));
    };
    req.send();
    deferred.request = req;
    return deferred;
}
function promiseDelay(ms) {
    const now = Date.now();
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(Date.now() - now);
        }, ms);
    });
}
function timeoutPromise(promise, ms) {
    const timeout = promiseDelay(ms).then(() => {
        const timeOutError = new Error("Operation timed out after " + ms + " ms");
        timeOutError.name = "timeOutError";
        throw new timeOutError;
    });
    return Promise.race([promise, timeout]);
}

const xhrDeferred = getXHRTimeout("https://api.myjson.com/bins/5r4r");
timeoutPromise(xhrDeferred.promise, 10)
    .then((contents) => {
        console.log("Here are the contents", contents);
    }).
    catch((error) => {
        if (error.name === "timeOutError") {
            xhrDeferred.request.abort();
            console.error(error);
            return;
        }
        console.log("XHR Error :", error);
    });
