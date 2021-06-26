
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


