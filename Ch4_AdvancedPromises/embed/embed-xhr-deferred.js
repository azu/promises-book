
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
function fetchURL(URL) {
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
    return deferred.promise;
}

