
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


