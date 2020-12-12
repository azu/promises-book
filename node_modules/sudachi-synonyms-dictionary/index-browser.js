let cachedJSON = null;

/**
 * Fetch dictionary from `url` option or window["sudachi-synonyms-dictionary"]
 * @param options
 * @returns {Promise<SudachiSynonymsGroup[]>}
 */
function fetchDictionary(options) {
    // for browser that depended on `fetch` API
    // for browser hack
    // window["sudachi-synonyms-dictionary"] = "https://example.com/sudachi-synonyms-dictionary.json"
    const dictionaryURL = options.url || window["sudachi-synonyms-dictionary"];
    if (!dictionaryURL) {
        throw new Error("sudachi-synonyms-dictionary: dictionary url is undefined.");
    }
    // cached json
    if (cachedJSON) {
        return Promise.resolve(cachedJSON);
    }
    return fetch(dictionaryURL).then(res => {
        if (!res.ok) {
            return Promise.reject(new Error(res.statusText));
        }
        return res.json();
    }).then(json => {
        cachedJSON = json;
        return json;
    });
}

module.exports.fetchDictionary = fetchDictionary;
