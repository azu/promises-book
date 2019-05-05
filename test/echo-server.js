var http = require("http");
var url = require("url");
var querystring = require("querystring");
var server = null;
var port = process.env.PORT || 3000;
function start() {
    server = http.createServer();
    server.on("request", function (request, response) {
        var uri = url.parse(request.url);
        var qs = uri.query ? querystring.parse(uri.query) : {};

        var status = qs.status || 200;
        var contentType = qs.contentType || "text/plain";
        var body = qs.body || "hello there!";

        response.writeHead(status, {
            "Content-Type": contentType,
            "Content-Length": body.length
        });

        console.log(uri.pathname + " - HTTP " + status + " (" + contentType + "): " + body);

        response.end(body);
    });

    return new Promise((resolve, reject) => {
        server.listen(port, function (error) {
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
