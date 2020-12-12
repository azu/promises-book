# sudachi-synonyms-dictionary

Sudashu's synonyms dictionary

It is a npm package for Sudachi's [synonyms dictionary](https://github.com/WorksApplications/SudachiDict/blob/develop/docs/synonyms.md)

- Source: 

## Install

Install with [npm](https://www.npmjs.com/):

    npm install sudachi-synonyms-dictionary

## Usage

```js 
const dict = require("sudachi-synonyms-dictionary");
// dict is array
console.log(dict);
/*
[{
    "id": "000001",
    "items": [{
        "taigenYogen": "体言",
        "expandControl": 0,
        "vocabularyNumber": 1,
        "gokeiSyubetsu": "代表語",
        "ryakusyou": "代表語形",
        "hyoukiYure": "未定義",
        "bunya": [],
        "midashi": "曖昧"
    }, {
        "taigenYogen": "体言",
        "expandControl": 0,
        "vocabularyNumber": 1,
        "gokeiSyubetsu": "代表語",
        "ryakusyou": "代表語形",
        "hyoukiYure": "アルファベット表記",
        "bunya": [],
        "midashi": "あいまい"
    }, {
        "taigenYogen": "体言",
        "expandControl": 0,
        "vocabularyNumber": 2,
        "gokeiSyubetsu": "代表語",
        "ryakusyou": "代表語形",
        "hyoukiYure": "未定義",
        "bunya": [],
        "midashi": "不明確"
    }, {
        "taigenYogen": "体言",
        "expandControl": 0,
        "vocabularyNumber": 3,
        "gokeiSyubetsu": "代表語",
        "ryakusyou": "代表語形",
        "hyoukiYure": "未定義",
        "bunya": [],
        "midashi": "あやふや"
    }, {
        "taigenYogen": "体言",
        "expandControl": 0,
        "vocabularyNumber": 4,
        "gokeiSyubetsu": "代表語",
        "ryakusyou": "代表語形",
        "hyoukiYure": "未定義",
        "bunya": [],
        "midashi": "不明瞭"
    }, {
        "taigenYogen": "体言",
        "expandControl": 0,
        "vocabularyNumber": 5,
        "gokeiSyubetsu": "代表語",
        "ryakusyou": "代表語形",
        "hyoukiYure": "未定義",
        "bunya": [],
        "midashi": "不確か"
    }]
}, ...]
```

For more details, see [sudachi-synonyms-parser](https://github.com/azu/sudachi-synonyms-parser).

## Changelog

See [Releases page](https://github.com/azu/sudachi-synonyms-dictionary/releases).

## Release Flow

This repository has semi-automatic release flow:

- [cron-update-dictionary.yml](.github/workflows/cron-update-dictionary.yml): If sudachi's dictionary is updated, submit Pull Request
- [release.yml](.github/workflows/release.yml): If [sudachi-synonyms-dictionary.json](sudachi-synonyms-dictionary.json) is updated, publish new version to npm

## Running tests

Install devDependencies and Run `npm test`:

    npm test

## Contributing

Pull requests and stars are always welcome.

For bugs and feature requests, [please create an issue](https://github.com/azu/sudachi-synonyms-dictionary/issues).

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## Author

- [github/azu](https://github.com/azu)
- [twitter/azu_re](https://twitter.com/azu_re)

## License

Apache License, Version 2.0 © azu

This package includes following:

Copyright (c) 2017 Works Applications Co., Ltd.

   http://www.apache.org/licenses/LICENSE-2.0
   https://github.com/WorksApplications/SudachiDict
