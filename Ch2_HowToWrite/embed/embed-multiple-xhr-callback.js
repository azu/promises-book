function fetchURLCallback(URL, callback) {
    const req = new XMLHttpRequest();
    req.open("GET", URL, true);
    req.onload = () => {
        if (200 <= req.status && req.status < 300) {
            callback(null, req.responseText);
        } else {
            callback(new Error(req.statusText), req.response);
        }
    };
    req.onerror = () => {
        callback(new Error(req.statusText));
    };
    req.send();
}
// <1> JSONパースを安全に行う
function jsonParse(callback, error, value) {
    if (error) {
        callback(error, value);
    } else {
        try {
            const result = JSON.parse(value);
            callback(null, result);
        } catch (e) {
            callback(e, value);
        }
    }
}
// <2> XHRを叩いてリクエスト
const request = {
    comment(callback) {
        return fetchURLCallback("https://azu.github.io/promises-book/json/comment.json", jsonParse.bind(null, callback));
    },
    people(callback) {
        return fetchURLCallback("https://azu.github.io/promises-book/json/people.json", jsonParse.bind(null, callback));
    }
};
// <3> 複数のXHRリクエストを行い、全部終わったらcallbackを呼ぶ
function allRequest(requests, callback, results) {
    if (requests.length === 0) {
        return callback(null, results);
    }
    const req = requests.shift();
    req((error, value) => {
        if (error) {
            callback(error, value);
        } else {
            results.push(value);
            allRequest(requests, callback, results);
        }
    });
}

function main(callback) {
    allRequest([request.comment, request.people], callback, []);
}



