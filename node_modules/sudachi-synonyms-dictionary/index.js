let cachedJSON = null;

function fetchDictionary(options) {
    // for browser that depended on `fetch` API
    if (options && options.url) {
        if (cachedJSON) {
            return Promise.resolve(cachedJSON);
        }
        return fetch(options.url).then(res => {
            if (!res.ok) {
                return Promise.reject(new Error(res.statusText));
            }
            return res.json();
        }).then(json => {
            cachedJSON = json;
            return json;
        });
    }
    return Promise.resolve(require("./sudachi-synonyms-dictionary"));
}

module.exports.fetchDictionary = fetchDictionary;
