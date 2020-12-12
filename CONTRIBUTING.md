## 実行環境

PromisesはECMAScriptであることを元に進めるが、現実的に非同期な処理がECMAScriptには少ないのでDOM APIも使用する。

Promisesが実装されていない環境もあるため、[core-js](https://github.com/zloirock/core-js)をPolyfillとして利用する。

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

## テスト

サンプルコードは必ずテストコードが必要となる。
読者がコピペして実行するようなコードにはテストを書くべきである。

テストは大きく分けて2種類の実装があるため、どちらかの方法でサンプルコードに対してテストを実装する必要がある

- UnitTest
- DocTest

### UnitTest

この書籍では、サンプルコードのソースコード(`lib/`)と表示用のコード(`embed/`)を分けている。

基本的には`lib/`から`embed/`がビルド時に生成され、書籍には`embed/`のコードが埋め込まれる。。

`lib/`のコードはCommonJSのコードとして書かれていて、モジュールとしてテストしたい機能を`module.exports`している。
そのため、UnitTestは通常のNode.jsのコードとしてテストコードを`test/`に実装している。

`lib/`から`embed/`に生成するコードは、[inlining-node-require](https://github.com/azu/inlining-node-require)を使って`require`で読み込んでいるファイルをインライン化している。(一部制約がある)

仕組みについては、次のページも参照してください。

- <https://github.com/azu/promises-book/blob/master/Appendix-Note/tooling-ci.adoc>

### DocTest

一部の章では、インラインコードに対して[power-doctest](https://github.com/azu/power-doctest)を使ったDocTestが実装されている。
実際に有効になってる章(ディレクトリ)は次のテストファイルで定義されている。

- <https://github.com/azu/promises-book/blob/master/test/doctest.js>

Asciidoc中のインラインコードブロックに、次のような`[source,javascript]`の言語が指定されたCodeBlockに対してpodtestが行われる。

```asciidoc
[source,javascript]
----
const str = "string";
console.log(str); // => "string"
----
```

次のように`// => 値`というコメントを書いた部分が、`assert`関数に変換されテストされる。
これにより、サンプルコードのコメントに書いた評価結果と実際の出力が一致するかをテストされている。

詳しい実装は次のドキュメントを参照してください。

- [@power-doctest/asciidoctor](https://github.com/azu/power-doctest/tree/master/packages/%40power-doctest/asciidoctor)
- [MarkdownやAsciidoc中に書いたJavaScriptのサンプルコードをdoctestするツールを作った | Web Scratch](https://github.com/efcl/efcl.github.io/edit/develop/_posts/2019/2019-09-02-power-doctest-markdown-asciidoc.md)


## サンプルコード

サンプルコードはできるだけ最小限で具体的かつ知名度の高いAPIを利用する。

`<1>` 等のアノテーションを使った説明用のコードは、そのままインラインで埋め込んでもよい。

できうる限り、インラインで直接書かないで、外部ファイルとして置いたものを読み込んで使用する。

### 非同期API

非同期APIとしては下記を中心的に利用する

* `setTimeout`
* `XMLHTTPRequest`
    * Polyfill : [ykzts/node-xmlhttprequest](https://github.com/ykzts/node-xmlhttprequest "ykzts/node-xmlhttprequest")
* node の Coreモジュール


実行環境は基本的にNode.jsでテストするようになっているが、
できるだけブラウザとNode.jsで同じようなコードにする方針とする。
(固有の箇所は環境を明示すればよい)

`test/test-helper.js` にグローバル空間に `Promise` や XHRが入るようにしている。
(そのためMochaを経由しない場合、Node環境ではサンプルコード単体が動かない場合がある…)

## 文章の表現

文章の表現をできる限り統一したいため、迷う表現については以下で方針を決めている。
追加したい表現がある場合は、以下に書き込めばよい。

- [表記の統一 · Issue #41 · azu/promises-book](https://github.com/azu/promises-book/issues/41 "表記の統一 · Issue #41 · azu/promises-book")

### Promise or Promises?

:negative_squared_cross_mark: Promises

Promiseという機能についていう時は大文字の単数を使う。

例外としてES PromisesやPromises/A+の仕様について言及する際はsをつけてもよい。

小文字で始まるpromiseはpromiseオブジェクトのみにする。

### resolve,reject / Fulfilled,Rejected の表現

#### resolve と reject の注釈

* それぞれの用語の日本語の対応は resolve = **成功時** 、 reject =  **失敗時** とする。
* resolveした時 ≠ 解決した時 としない(解決という言葉は紛らわしいので避けるべき)

#### promiseオブジェクトが主語の場合

* "promiseオブジェクトがFulfilled または Rejectedとなった時" と表記する
* 必ず大文字で **Fulfilled** とする

#### resolve,reject / Fulfilled,Rejected の使い分け

* "処理が成功した時" or "処理が失敗した時" という表現を使う場合、曖昧さが残らないように気をつける
    * たとえば、"処理が成功した場合は`onFulfilled`が呼ばれますが" というようにその結果についても触れる
* `new Promise` の処理について述べるなら、"resolveした時" と書いてもよい。
    * "resolveされた時" とは書かない
* `then`でのメソッドチェーン等、`new Promise`と直接関係ないケースの場合にはFulfilled,Rejectedを使う

例) `Promise.race`は、promiseオブジェクトがどれか一つでもFulfilled または Rejectedになったら次の処理を実行します。

## Asciidocのシンタックス

Asciidocでこの書籍は書かれているが、[Asciidoctor](https://asciidoctor.org/ "Asciidoctor")に依存した機能や表現を使用してよい。
シンタックスについては以下を参考にする。

- [Asciidoctor Documentation | Asciidoctor](http://asciidoctor.org/docs/ "Asciidoctor Documentation | Asciidoctor")

## Gitのコミットメッセージ

AngularJSのGit Commit Guidelinesをベースとする。

- [conventional-changelog/angular.md at master · ajoslin/conventional-changelog](https://github.com/ajoslin/conventional-changelog/blob/410cf5dfed2494874d3ed2f9acb6ad6bd51cdc1c/conventions/angular.md "conventional-changelog/angular.md at master · ajoslin/conventional-changelog")

以下のような形で1行目に概要、3行目から本文、最後に関連するIssue(任意)を書く。

```
feat(ngInclude): add template url parameter to events

The `src` (i.e. the url of the template to load) is now provided to the
`$includeContentRequested`, `$includeContentLoaded` and `$includeContentError`
events.

Closes #8453
Closes #8454
```


```
                         scope        commit title

        commit type       /                /      
                \        |                |
                 feat(ngInclude): add template url parameter to events

        body ->  The 'src` (i.e. the url of the template to load) is now provided to the
                 `$includeContentRequested`, `$includeContentLoaded` and `$includeContentError`
                 events.

 referenced  ->  Closes #8453
 issues          Closes #8454
```

commit typeには以下のような種類がある。

- `BREAKING CHANGE:` 破壊的な変更 - メジャーアップデートが必要
- `feat:` 新しい機能の追加 - マイナーアップデートが必要
- `fix:` リリースノートに含めるような修正 - パッチアップデートが必要
- `refactor:` リファクタリング
- `style:` コードスタイル、スペースの調整など
- `test:` テストの追加、修正
- `chore:` その他

1行目の`feat`や`fix`といったcommit typeは、迷ったらとりあえず`chore`と書いて、`scope`も省略して問題ないので、以下のような形でも問題ない。

```
chore: コミットメッセージ
```


[Releases · azu/promises-book](https://github.com/azu/promises-book/releases "Releases · azu/promises-book") を自動生成するために設けているルールである。

`BREAKING CHANGE`, `feat`, `fix` というcommit typeがリリースノートに自動的に含まれる。

Pull Requestの場合は、マージ時にコミットメッセージを入れられるため、それぞれのコミットで細かく気にする必要はない。
(わからない場合はとりあえず`chore`を使うか、ルール外のコミットメッセージをいれてもよい)

