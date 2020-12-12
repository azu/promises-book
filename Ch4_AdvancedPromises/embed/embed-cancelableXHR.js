const requestMap = {};
function createXHRPromise(URL) {
    const req = new XMLHttpRequest();
    const promise = new Promise((resolve, reject) => {
        req.open("GET", URL, true);
        req.onreadystatechange = function() {
            if (req.readyState === XMLHttpRequest.DONE) {
                delete requestMap[URL];
            }
        };
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
        req.onabort = () => {
            reject(new Error("abort this req"));
        };
        req.send();
    });
    requestMap[URL] = {
        promise: promise,
        request: req
    };
    return promise;
}

function abortPromise(promise) {
    if (typeof promise === "undefined") {
        return;
    }
    let request;
    Object.keys(requestMap).some((URL) => {
        if (requestMap[URL].promise === promise) {
            request = requestMap[URL].request;
            return true;
        }
    });
    if (request != null && request.readyState !== XMLHttpRequest.UNSENT) {
        request.abort();
    }
}


