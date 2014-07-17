### 1.1.2 (2014-07-08)


### 1.1.1 (2014-07-02)


## 1.1.0 (2014-06-25)


#### Bug Fixes

* **then-return-new-promise:** all/race初出に説明を補足 ([6c77be9c](https://github.com/azu/promises-book/commit/6c77be9c6a534844c48db5a4a980f789c3f9c792))


#### New and Edit

* **column-promise-resolve:**
  * 同期と非同期の混在の問題についてを追加 ([de5f8208](https://github.com/azu/promises-book/commit/de5f82082909484155d8aa94005b676a9f65c2e2))
  * 非同期で実行されているコードの解説を追加 ([ea8ca5d6](https://github.com/azu/promises-book/commit/ea8ca5d6f38ae8fde5d9f1b4e4b7521c1b261e63))

### 1.0.1 (2014-06-23)


#### Bug Fixes

* **glossary:** 余計なコメントが表示されていたのを修正 ([e01c9c0d](https://github.com/azu/promises-book/commit/e01c9c0de8ab584aa503105ad64e8eefcc17966e))
* **promise-overview:** 細かい言葉の抜けを修正 ([7b978fbc](https://github.com/azu/promises-book/commit/7b978fbc642de276c3d05b7842ba7b523d5ae9bd))


## 1.0.0 (2014-06-23)


#### Bug Fixes

* **glossary:** fix link to resource-link ([9c9d3d30](https://github.com/azu/promises-book/commit/9c9d3d30beb712b9311f8b0b5d81ac2cf379eac3))


#### New and Edit

* **beginning-story:**
  * WIP pull-requestを使い出した理由についてを追加 ([a99796ea](https://github.com/azu/promises-book/commit/a99796ea23e81f9b6dba9375fc6068ce853d8187), closes [#160](https://github.com/azu/promises-book/issues/160))
  * 好き勝手書いて行った時に発生した問題点 ([c0d2ef9c](https://github.com/azu/promises-book/commit/c0d2ef9cd352c2c98bd10692e3bbd7cef9bceed9), closes [#160](https://github.com/azu/promises-book/issues/160))
  * 移動中に執筆する作業するメリット・デメリット ([10eded5a](https://github.com/azu/promises-book/commit/10eded5a3b4a538af9e5d488ef1e7b9962dc308f), closes [#160](https://github.com/azu/promises-book/issues/160))
  * どこから書き始めたかについてを追加 ([a9c74fcd](https://github.com/azu/promises-book/commit/a9c74fcdc061bc2392d2c98399cf783ef387a1a4), closes [#160](https://github.com/azu/promises-book/issues/160))
  * 書籍を書き始めた理由を追加 ([12734f21](https://github.com/azu/promises-book/commit/12734f217b325c992162148e430efd66b9ca708d), closes [#160](https://github.com/azu/promises-book/issues/160))


#### Features

* **about-author:** 作者へのメッセージとgumroadへのリンクを追加した ([6387e6ac](https://github.com/azu/promises-book/commit/6387e6ac6c9cc6e4808ded6b8938918b64c4e125))
* **beginning-story:** おまけのPDFを生成出来るように ([38de54a2](https://github.com/azu/promises-book/commit/38de54a278d23682eb1ee57e6f05b176e807b64f))
* **index:** add Horizontal Rules or page break ([aced9ca4](https://github.com/azu/promises-book/commit/aced9ca47a8f6cf1c6dbd0182b8929a9fa3b4bd9))


### 0.2.1 (2014-06-15)


### 0.1.1 (2014-06-15)


#### Bug Fixes

* **css:**
  * Webkit系で横にスクロールが置きてしまう問題を修正 ([170a2198](https://github.com/azu/promises-book//commit/170a21980913876949b88b239dbd3981ca2ecdbc))
  * media-queryでモバイル時はGithubボタンを非表示に ([d08221e8](https://github.com/azu/promises-book//commit/d08221e87781f3de266bf379141da0f86b1fb42e))
  * 無駄な横スクロールが出る原因を修正 ([34dd1b22](https://github.com/azu/promises-book//commit/34dd1b2274ae213afd6efb68314fa8f5a7c04eab))
* **deferred-promise:** 画像が表示されてなかった ([d2998cd0](https://github.com/azu/promises-book//commit/d2998cd0e8c467b1e38404d11177ccd2381b8557), closes [#92](https://github.com/azu/promises-book//issues/92))
* **html:** support iOS ([17a9f5a9](https://github.com/azu/promises-book//commit/17a9f5a98abe4a92423572d7fcd9ac3b5400e73b))
* **inline-script-tester:** includeマクロとインラインコードの組み合わせに対応 ([70bcac92](https://github.com/azu/promises-book//commit/70bcac9273a9b94dbd8a4393a26706e617e594c2))
* **notification-thenable:** インラインコードを修正 ([bfb3f443](https://github.com/azu/promises-book//commit/bfb3f4431142eb27b21cc08efb6d183812a6627a))
* **readme:** Installationの手順に`npm install`, `npm install -g gulp`を追加 ([f097c348](https://github.com/azu/promises-book//commit/f097c3486c338fe1c81650320d332b9d442c98d0))


#### New and Edit

* **promise-all:** timerPromisefyベースのものへと対応 ([c0a13637](https://github.com/azu/promises-book//commit/c0a136373c11bf82f8d0ed89879fba141643ded1), closes [#123](https://github.com/azu/promises-book//issues/123))


#### Features

* **console:** コンソールエディタに`Promise`のpolyfill参照させるように ([f8b1a6de](https://github.com/azu/promises-book//commit/f8b1a6ded69370af214b76273a8e076198cc2465), closes [#124](https://github.com/azu/promises-book//issues/124))
* **html:**
  * コード例を実行出来るエディタを追加 ([12a11b63](https://github.com/azu/promises-book//commit/12a11b63bc48a4360100fde4889724c65e407901), closes [#18](https://github.com/azu/promises-book//issues/18))
  * add Feedback button ([a15137cd](https://github.com/azu/promises-book//commit/a15137cd19de4cf35e0d315a41a59772766c32c4))


