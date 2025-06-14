const http = require("http");
const url = require("url");
const querystring = require("querystring");
let server = null;
const port = process.env.PORT || 3000;
function start() {
    server = http.createServer();
    server.on("request", (request, response) => {
        const uri = url.parse(request.url);
        const qs = uri.query ? querystring.parse(uri.query) : {};

        const status = qs.status || 200;
        const contentType = qs.contentType || "text/plain";
        const body = qs.body || "hello there!";

        response.writeHead(status, {
            "Content-Type": contentType,
            "Content-Length": body.length
        });

        console.log(uri.pathname + " - HTTP " + status + " (" + contentType + "): " + body);

        response.end(body);
    });

    return new Promise((resolve, reject) => {
        server.listen(port, (error) => {
            if (error) {
                return reject(error);
            }
            console.log("listening on port " + port);
            resolve();
        });
    });

}

function stop() {
    return new Promise((resolve, reject) => {
        if (!server) {
            return resolve();
        }
        server.close((error) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    });
}

module.exports = {
    start,
    stop
};
