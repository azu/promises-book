function sequenceTasks(tasks) {
    function recordValue(results, value) {
        results.push(value);
        return results;
    }

    const pushValue = recordValue.bind(null, []);
    return tasks.reduce((promise, task) => {
        return promise.then(task).then(pushValue);
    }, Promise.resolve());
}
function fetchURL(URL) {
    return new Promise((resolve, reject) => {
        const req = new XMLHttpRequest();
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
        req.send();
    });
}
const request = {
    comment() {
        return fetchURL("https://azu.github.io/promises-book/json/comment.json").then(JSON.parse);
    },
    people() {
        return fetchURL("https://azu.github.io/promises-book/json/people.json").then(JSON.parse);
    }
};
function main() {
    return sequenceTasks([request.comment, request.people]);
}



