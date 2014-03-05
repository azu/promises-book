## 実行環境

PromisesはECMAScriptである事を元に進めるが、現実的に非同期な処理がECMAScriptには少ないのでDOM API等も使う。

Promisesが実装されていない環境もあるため、[ypromise](https://github.com/yahoo/ypromise "ypromise")をPolyfillとして利用する。

## プロジェクト構造

大きな区分けとして各チャプターごとにディレクトリを分けている。

それぞれのディレクトリにサンプルコードのソース、テスト、画像等リソースを加える。

できるだけ、一つのasciidocファイル単体でも見られる形にする。

### ディレクトリの命名規則

* src/
    * サンプルコードのソースが入る
* test/
    * サンプルコードのテストコードが入る
* img/
    * 画像等のリソースファイルが入る

各ディレクトリにはその章の序文と各節を`include`するREADME.adocファイルが置かれる。

### テスト

サンプルコードは必ずテストコードが必要となる。(読者がコピペして実行するようなコードをテストを書くべきである)

`<1>` 等のアノテーションを使った説明用のコードは、そのままインラインで埋め込んでもよい。

### 実行コード

サンプルコードはできるだけ最小限で具体的かつ知名度の高いAPIを利用する。

#### 非同期API

非同期APIとしては下記を中心的に利用する

* `setTimeout`
* `XMLHTTPRequest`
    * Polyfill : [ykzts/node-xmlhttprequest](https://github.com/ykzts/node-xmlhttprequest "ykzts/node-xmlhttprequest")
* node の 何かモジュール

=> 案がある場合は [Issues](https://github.com/azu/Promises-book/issues "Issues · azu/Promises-book")へ

実行環境は基本的にNode.jsでテストするようになっているが、
できるだけブラウザとNode.jsとで同じようなコードにする方針。
(固有の箇所は環境を明示すればよい)

`test/test-helper.js` にグローバル空間に `Promise` や XHRが入るようにしている。
(そのためMochaを経由しない場合、Node環境ではサンプルコード単体が動かない場合がある…)