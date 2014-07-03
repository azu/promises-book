## 実行環境

PromisesはECMAScriptである事を元に進めるが、現実的に非同期な処理がECMAScriptには少ないのでDOM API等も使う。

Promisesが実装されていない環境もあるため、[ypromise](https://github.com/yahoo/ypromise "ypromise")をPolyfillとして利用する。

## プロジェクト構造

大きな区分けとして各チャプターごとにディレクトリを分けている。

それぞれのディレクトリにサンプルコードのソース、テスト、画像等リソースを配置する

できるだけ、一つのasciidocファイル単体でも見られる形にする。

### ディレクトリの命名規則

* src/
    * サンプルコードのソースが入る
* lib/
    * サンプルコードで共通に使うライブラリ的な役割のコードが入る
* test/
    * サンプルコードのテストコードが入る
* img/
    * 画像等のリソースファイルが入る

各ディレクトリにはその章の序文と各節を`include`するREADME.adocファイルが置かれる。

### テスト

サンプルコードは必ずテストコードが必要となる。(読者がコピペして実行するようなコードにはテストを書くべきである)


### サンプルコード

サンプルコードはできるだけ最小限で具体的かつ知名度の高いAPIを利用する。

`<1>` 等のアノテーションを使った説明用のコードは、そのままインラインで埋め込んでもよい。

できうる限り、インラインで直接書かないで、外部ファイルとして置いたものを読み込んで使用する。

#### 非同期API

非同期APIとしては下記を中心的に利用する

* `setTimeout`
* `XMLHTTPRequest`
    * Polyfill : [ykzts/node-xmlhttprequest](https://github.com/ykzts/node-xmlhttprequest "ykzts/node-xmlhttprequest")
* node の Coreモジュール

=> 案がある場合は [Issues](https://github.com/azu/Promises-book/issues "Issues · azu/Promises-book")へ

実行環境は基本的にNode.jsでテストするようになっているが、
できるだけブラウザとNode.jsで同じようなコードにする方針
(固有の箇所は環境を明示すればよい)

`test/test-helper.js` にグローバル空間に `Promise` や XHRが入るようにしている。
(そのためMochaを経由しない場合、Node環境ではサンプルコード単体が動かない場合がある…)

## 文章の表現

文章の表現を出来る限り統一したいため、まよいそうな表現については方針を決めている

> [表記の統一 · Issue #41 · azu/promises-book](https://github.com/azu/promises-book/issues/41 "表記の統一 · Issue #41 · azu/promises-book") で議論された

### Promise or Promises?

:negative_squared_cross_mark: Promises

Promiseという機能について言う時は大文字の単数を使う。

例外としてES6 PromisesやPromises/A+の仕様について言及する際はsをつけてもよい。

小文字で始まるpromiseはpromiseオブジェクトのみにする。

### resolve,reject / FulFilled,Rejected の表現

#### resolve と reject の注釈

* それぞれの用語の日本語の対応は resolve = **成功時** 、 reject =  **失敗時** とする。
* resolveした時 ≠ 解決した時 としない(解決という言葉は紛らわしいので避けるべき)

#### promiseオブジェクトが主語の場合

* "promiseオブジェクトがFulFilled または Rejectedとなった時" と表記する
* 必ず大文字で **FulFilled** とする

#### resolve,reject / FulFilled,Rejected の使い分け

* "処理が成功した時" or "処理が失敗した時" という表現を使う場合、曖昧さが残らないように気をつける
    * 例えば、"処理が成功した場合は`onFulfilled`が呼ばれますが" というようにその結果についても触れる
* `new Promise` の処理について述べるなら、"resolveした時" と書いてもよい。
    * "resolveされた時" とは書かない
* `then`でのメソッドチェーン等、`new Promise`と直接関係ないケースの場合にはFulFilled,Rejectedを使う

例) `Promise.race`は、promiseオブジェクトがどれか一つでもFulFilled または Rejectedになったら次の処理を実行します。


## Gitのコミットメッセージ

コミットメッセージのルールは以下のルールに基本的には従う。

* [conventional-changelog/CONVENTIONS.md at master · ajoslin/conventional-changelog](https://github.com/ajoslin/conventional-changelog/blob/master/CONVENTIONS.md "conventional-changelog/CONVENTIONS.md at master · ajoslin/conventional-changelog") 

[CHANGELOG.md](CHANGELOG.md) を自動生成するために設けているルールである。

`feat`, `write`, `fix`, `docs` という属性がCHANGELOGの対象になっている。

pull-requestの場合は、マージ時にコミットメッセージを入れられるため、それぞれのコミットで細かく気にする必要はない。
(わからない場合はとりあえず`chore`を使うか、ルール外のコミットメッセージをいれてもよい)

