# @textlint-ja/textlint-rule-no-synonyms [![Actions Status](https://github.com/textlint-ja/textlint-rule-no-synonyms/workflows/ci/badge.svg)](https://github.com/textlint-ja/textlint-rule-no-synonyms/actions?query=workflow%3Aci)

同義語を表記ゆれをチェックするtextlintルールです。

同義語の辞書として[Sudachi 同義語辞書](https://github.com/WorksApplications/SudachiDict/blob/develop/docs/synonyms.md)を利用しています。

**NG**:

```
サーバとサーバーの表記揺れがある。
この雇入と雇入れの違いを見つける。
```

## Install

Install with [npm](https://www.npmjs.com/):

    npm install @textlint-ja/textlint-rule-no-synonyms sudachi-synonyms-dictionary

辞書となる[sudachi-synonyms-dictionary](https://github.com/azu/sudachi-synonyms-dictionary)は[peerDependencies](https://npm.github.io/using-pkgs-docs/package-json/types/peerdependencies.html)なので、ルールとは別途インストールする必要があります。

## Usage

Via `.textlintrc`(Recommended)

```json
{
    "rules": {
        "@textlint-ja/no-synonyms": true
    }
}
```

Via CLI

```
textlint --rule @textlint-ja/no-synonyms README.md
```

## Options

```ts
{
    /**
     * 許可するワードの配列
     * ワードは完全一致で比較し、一致した場合は無視されます
     * 例) ["ウェブアプリ", "ウェブアプリケーション"]
     */
    allows?: string[];
    /**
     * 同じ語形の語の中でのアルファベットの表記揺れを許可するかどうか
     * trueの場合はカタカナとアルファベットの表記ゆれを許可します
     * 例) 「ブログ」と「blog」
     * Default: true
     */
    allowAlphabet?: boolean;
}
```

**Example**:

```json
{
    "rules": {
        "@textlint-ja/no-synonyms": {
            "allows": ["ウェブアプリ", "ウェブアプリケーション"],
            "allowAlphabet": false
        }
    }
}
```

## References

- [Sudachi 同義語辞書](https://github.com/WorksApplications/SudachiDict/blob/develop/docs/synonyms.md)
- [azu/sudachi-synonyms-dictionary: Sudachi's synonyms dictionary](https://github.com/azu/sudachi-synonyms-dictionary)
- [azu/sudachi-synonyms-parser: Sudachi's synonyms dictionary parser](https://github.com/azu/sudachi-synonyms-parser)


## Changelog

See [Releases page](https://github.com/textlint-ja/textlint-rule-no-synonyms/releases).

## Running tests

Install devDependencies and Run `npm test`:

    npm i -d && npm test

## Contributing

Pull requests and stars are always welcome.

For bugs and feature requests, [please create an issue](https://github.com/textlint-ja/textlint-rule-no-synonyms/issues).

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## Author

- [github/azu](https://github.com/azu)
- [twitter/azu_re](https://twitter.com/azu_re)

## License

MIT © azu
