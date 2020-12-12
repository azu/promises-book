<a name="5.4.3"></a>
## [5.4.3](https://github.com/prh/prh/compare/5.4.2...5.4.3) (2017-08-23)


### Bug Fixes

* **prh:** 検出したDiffの範囲に重複がある場合、重複したDiffを無視するようにした ([837c422](https://github.com/prh/prh/commit/837c422))



<a name="5.4.2"></a>
## [5.4.2](https://github.com/prh/prh/compare/5.4.1...5.4.2) (2017-08-22)


### Bug Fixes

* **prh:** Diffの作成時に変換前と変換後が一致する場合、それをどのようなパターンでも結果から除外するように修正 ([dc61ede](https://github.com/prh/prh/commit/dc61ede))


### Features

* **rules:** バンドルするルールの更新 ([72bc03b](https://github.com/prh/prh/commit/72bc03b))



<a name="5.4.1"></a>
## [5.4.1](https://github.com/prh/prh/compare/5.4.0...5.4.1) (2017-08-22)


### Bug Fixes

* **prh:** --stdout を指定した時に余計な空行を末尾に追加していたのを修正 fixes [#28](https://github.com/prh/prh/issues/28) ([55cb83a](https://github.com/prh/prh/commit/55cb83a))


### Features

* **prh:** conventional-changelogの呼び出し方法を変えて脱grunt化した ([f3a2786](https://github.com/prh/prh/commit/f3a2786))



<a name="5.4.0"></a>
# [5.4.0](https://github.com/prh/prh/compare/5.3.0...5.4.0) (2017-08-20)

fromYAMLFilePathなどに非同期版を用意しました。
将来的にEngine生成の非同期化を行ったり、Node.js環境縛りを緩和するために同期版のサポートを打ち切る可能性があります。

### Bug Fixes

* **prh:** patternsとwordBoundaryを同時に指定した場合も\bを付加するように ([b52261f](https://github.com/prh/prh/commit/b52261f))


### Features

* **prh:** 別のファイルをimportする時の挙動をある程度制御できるように変更 fixes [#19](https://github.com/prh/prh/issues/19) ([cd17abe](https://github.com/prh/prh/commit/cd17abe))
* **prh:** 将来的な変更に備え、処理を非同期化したAPIを用意した ([9cb0c79](https://github.com/prh/prh/commit/9cb0c79))



<a name="5.3.0"></a>
# [5.3.0](https://github.com/prh/prh/compare/5.2.0...5.3.0) (2017-08-17)


### Features

* **prh:** EngineにsourcePathsプロパティを追加 どのファイルをソースにして生成されたかを保持する ([4bcdeb8](https://github.com/prh/prh/commit/4bcdeb8))



<a name="5.2.0"></a>
# [5.2.0](https://github.com/prh/prh/compare/5.1.1...5.2.0) (2017-08-17)


### Features

* **prh:** Diffから変換後のnewTextを取得できるようにした ([717b7c1](https://github.com/prh/prh/commit/717b7c1))
* **prh:** gitのsubmoduleをrulesからprh-rulesに移動 ([eb5812b](https://github.com/prh/prh/commit/eb5812b))
* **prh:** misc/prh.yml の内容をより実践ですぐ使える形式に変更 ([b34ee1d](https://github.com/prh/prh/commit/b34ee1d))



<a name="5.1.1"></a>
## [5.1.1](https://github.com/prh/prh/compare/v5.1.0...v5.1.1) (2017-08-17)


### Bug Fixes

* **prh:** 命名の一貫性が損なわれてたのを修正 fromYAMLFilePaths に変更 ([b2f6fd2](https://github.com/prh/prh/commit/b2f6fd2))



<a name="5.1.0"></a>
# [5.1.0](https://github.com/prh/prh/compare/5.0.0...5.1.0) (2017-08-17)


### Features

* **prh:** 複数の設定ファイルから単一のEngineを作る fromYamlFilePaths 公開関数を追加 ([df6679a](https://github.com/prh/prh/commit/df6679a))



<a name="5.0.0"></a>
# [5.0.0](https://github.com/prh/prh/compare/4.0.0...5.0.0) (2017-08-16)

`--rules` 指定無しの時の設定ファイルを探索するルールが変わりました。
v4.xまではコマンドを実行したディレクトリにある`prh.yml`でしたが、v5からは処理対象ファイルと同じディレクトリまたはそれより上の階層の`prh.yml`を個別に探索し利用します。
`prh.yml`を発見できなかった場合はエラーになります。

連日のBREAKING CHANGEですんません…！今後落ち着くはずです。

### Features

* **prh:** --verify と他のオプションを組み合わせて実行できるように変更 ([3a08ec1](https://github.com/prh/prh/commit/3a08ec1))
* **prh:** .npmignoreにCircle CIやtoolsを追加 ([de16162](https://github.com/prh/prh/commit/de16162))
* **prh:** BREAKING CHANGE --rules 指定なしの場合、処理対象ファイルから直近のprh.ymlを探索して使うように変更 ([9f94875](https://github.com/prh/prh/commit/9f94875))
* **prh:** getRuleFilePath を公開された関数として追加 ([7b72efe](https://github.com/prh/prh/commit/7b72efe))
* **prh:** どのファイルがどの設定を元に動作しているかわからないとつらそうなので --verbose オプションを追加 ([bffcef2](https://github.com/prh/prh/commit/bffcef2))



<a name="4.0.0"></a>
# [4.0.0](https://github.com/prh/prh/compare/3.1.1...4.0.0) (2017-08-15)

コマンドラインからの利用がしやすいように色々と手を加えました。
v3系から破壊的変更もあるので気をつけてください。
API上の破壊的変更はありません。

* `--json` オプションを `--rules-json` オプションに変更
* `--yaml` オプションを `--rules-yaml` オプションに変更
* デフォルトの挙動は校正後のファイルをstdoutに出力していたのを止めた
  * `--stdout` オプションを導入（v3でのデフォルトの挙動だったもの）
* `--diff` オプションを導入
* `--verify` オプションを導入

詳しくはREADME.mdを参照してください。

### Bug Fixes

* **prh:** CIのNode.jsバージョンを6系に変更 ([e2c33dc](https://github.com/prh/prh/commit/e2c33dc))
* **prh:** prh:disable プラグマの挙動が意図と完全に逆になってたのを修正… ([24f734e](https://github.com/prh/prh/commit/24f734e))
* **prh:** 差分作成処理で変化がない置き換えパターンが生成されていたのを修正 ([a95f7c4](https://github.com/prh/prh/commit/a95f7c4))


### Features

* **prh:** --diff オプションの実装 unified diff形式で差分出力できるようにした ([9ffa09e](https://github.com/prh/prh/commit/9ffa09e))
* **prh:** --replace で置き換えたファイルがある場合、stderrに置き換えたファイル名を出力するようにした ([f8a07a8](https://github.com/prh/prh/commit/f8a07a8))
* **prh:** --report オプションの実装 ([bef8ab0](https://github.com/prh/prh/commit/bef8ab0))
  * --report をデフォルトの挙動に変更 既存の挙動は --stdout に移動 ([83a09cc](https://github.com/prh/prh/commit/83a09cc))
* **prh:** BREAKING CHANGE --json と --yaml オプションを --rules-json と --rules-yaml オプションに変更 ([69da647](https://github.com/prh/prh/commit/69da647))
* **prh:** indexから行&列に変換するユーティリティを追加 ([1621b5f](https://github.com/prh/prh/commit/1621b5f))
* **prh:** 変更差分の有無をexit codeで返す --verify オプションの追加 ([2e38924](https://github.com/prh/prh/commit/2e38924))



<a name="3.1.1"></a>
## [3.1.1](https://github.com/vvakame/prh/compare/3.1.0...3.1.1) (2017-08-07)


### Bug Fixes

* **prh:** patternが空文字の時にエラーで弾くように修正 fixes [#24](https://github.com/vvakame/prh/issues/24) ([a722165](https://github.com/vvakame/prh/commit/a722165))
* **prh:** regexpSpec.tsがテスト対象になっていなかったのを修正 ([a53a36b](https://github.com/vvakame/prh/commit/a53a36b))
* **prh:** 正規表現のconcatとcombineでフラグを考慮して処理するように修正 fixes [#25](https://github.com/vvakame/prh/issues/25) ([997b0f4](https://github.com/vvakame/prh/commit/997b0f4))



<a name="3.1.0"></a>
# [3.1.0](https://github.com/vvakame/prh/compare/3.0.1...3.1.0) (2017-08-06)


### Features

* **prh:** 依存関係の更新 ([b33108b](https://github.com/vvakame/prh/commit/b33108b))
* **prh:** 段落毎にテキストをブロックに切り、警告を抑制できる仕組みを追加 ([416a2d1](https://github.com/vvakame/prh/commit/416a2d1))



<a name="3.0.1"></a>
## [3.0.1](https://github.com/vvakame/prh/compare/3.0.0...3.0.1) (2017-05-06)


### Features

* **prh:** Diffのis*系メソッドについて引数の条件を少し緩和した ([e219e27](https://github.com/vvakame/prh/commit/e219e27))



<a name="3.0.0"></a>
# [3.0.0](https://github.com/vvakame/prh/compare/2.0.0...3.0.0) (2017-05-06)

APIのクリーニングをやった。
Language Server Protocolと組み合わせてみるにあたり、ChangeSetに元のファイルパスやコンテンツ内容を保持していたほうが都合がよかったため。

### Features

* **ci:** Circle CI 2.0に移行してみよう ([#23](https://github.com/vvakame/prh/issues/23)) ([3641966](https://github.com/vvakame/prh/commit/3641966))
* **prh:** コード全体を見返してAPIを整理した ([ad0b89e](https://github.com/vvakame/prh/commit/ad0b89e))
* **prh:** 正規表現を生成する時にデフォルトでunicodeフラグを追加するように変更 ([815ffda](https://github.com/vvakame/prh/commit/815ffda))



<a name="2.0.0"></a>
# [2.0.0](https://github.com/vvakame/prh/compare/1.1.0...2.0.0) (2017-05-04)


### Features

* **deps:** 脱gruntしていく ([396fd6f](https://github.com/vvakame/prh/commit/396fd6f))
* **prh:** ChangeSetとDiffを外部から参照したい場合があったので参照できるようにした ([9f1b985](https://github.com/vvakame/prh/commit/9f1b985))
* **prh:** tsconfig.jsonでstrictNullChecksを有効にした ([f222506](https://github.com/vvakame/prh/commit/f222506))



<a name="1.1.0"></a>
# [1.1.0](https://github.com/vvakame/prh/compare/1.0.3...v1.1.0) (2016-10-27)

今まで misc フォルダにあったものが、[prh/rules](https://github.com/prh/rules)に移動しました。
ガイドラインの議論についてはrulesの[#1](https://github.com/prh/rules/issues/1)を見てください。

### Bug Fixes

* **WEB+DB_PRESS_r2.yml:** 2013年に商号がSBクリエイティブになったそうな ([3ed8900](https://github.com/vvakame/prh/commit/3ed8900))
* **WEB+DB_PRESS_r2.yml:** update WEB+DB_PRESS_r2.yml "Debian GNU/Linux"がfixしても校正されてしまうのを修正 ([#22](https://github.com/vvakame/prh/issues/22)) ([8022761](https://github.com/vvakame/prh/commit/8022761))


### Features

* **prh:** rules フォルダ新設とprh org移管に伴い各所を書き換え ([a7eea21](https://github.com/vvakame/prh/commit/a7eea21))
* **prh:** rules をgit submoduleとして配置 ([b67a462](https://github.com/vvakame/prh/commit/b67a462))
* **tools:** WZエディタ用ルールセットからprh用yamlに近いものに変換するスクリプトを作成 ([25a52fe](https://github.com/vvakame/prh/commit/25a52fe))
* **WEB+DB_PRESS_r2.yml:** WEB+DB_PRESS.yml から移植可能な部分を移植した ([e18d98e](https://github.com/vvakame/prh/commit/e18d98e))



<a name="1.0.3"></a>
## [1.0.3](https://github.com/vvakame/prh/compare/1.0.2...v1.0.3) (2016-10-02)


### Bug Fixes

* **prh:** choreでうっかりbreaking changeしてたのをもとに戻した ([29b5f9f](https://github.com/vvakame/prh/commit/29b5f9f))



<a name="1.0.2"></a>
## [1.0.2](https://github.com/vvakame/prh/compare/1.0.1...v1.0.2) (2016-09-23)


use TypeScript 2.0.3 yay!

### Bug Fixes

* **prh.yml:** 否定後読みについてのサンプルを追加 fixes [#17](https://github.com/vvakame/prh/issues/17) ([fbfe747](https://github.com/vvakame/prh/commit/fbfe747))


### Features

* **ci:** add grunt-cli to devDependencies ([50f8a63](https://github.com/vvakame/prh/commit/50f8a63))
* **techbooster.yml:** Android用の語彙を少し追加 ([9ea54f4](https://github.com/vvakame/prh/commit/9ea54f4))
* **techbooster.yml:** C90-Androidリポジトリの変更差分を取り込み ([18e7959](https://github.com/vvakame/prh/commit/18e7959))
* **techbooster.yml:** C90-WebTechリポジトリの変更差分を取り込み ([ecc4397](https://github.com/vvakame/prh/commit/ecc4397))
* **techbooster.yml:** 技術書典のルールを追加 ([53790d3](https://github.com/vvakame/prh/commit/53790d3))



<a name="1.0.1"></a>
## [1.0.1](https://github.com/vvakame/prh/compare/1.0.0...v1.0.1) (2016-05-30)


### Bug Fixes

* **prh:** Engine#mergeで別ルールをマージする時にルールの除去を一括で行うようの修正 closes [#18](https://github.com/vvakame/prh/issues/18) ([904b23b](https://github.com/vvakame/prh/commit/904b23b)), closes [#18](https://github.com/vvakame/prh/issues/18)
* **techbooster.yml:** その時間 が警告にならないように修正 ([e1a9e7f](https://github.com/vvakame/prh/commit/e1a9e7f))



<a name="1.0.0"></a>
# [1.0.0](https://github.com/vvakame/prh/compare/0.9.0...v1.0.0) (2016-05-02)

prh is stable.

### Bug Fixes

* **techbooster.yml:** 記事 を 記こと に開かないようにした([5ee3c62](https://github.com/vvakame/prh/commit/5ee3c62))
* **techbooster.yml:** 下記の を 次の と言い換えるように修正([73206fe](https://github.com/vvakame/prh/commit/73206fe))
* **techbooster.yml:** 事実 事体 の 事 を開かないようにした([5ae9ec1](https://github.com/vvakame/prh/commit/5ae9ec1))
* **techbooster.yml:** 事態 を こと態 に開こうとしていたのを修正([1faea5d](https://github.com/vvakame/prh/commit/1faea5d))
* **techbooster.yml:** 仕事 を 仕こと に開こうとしていたのを修正([325f92e](https://github.com/vvakame/prh/commit/325f92e))
* **techbooster.yml:** 変更に を 変さらに に開かないように修正([1a3af91](https://github.com/vvakame/prh/commit/1a3af91))
* **techbooster.yml:** 大事 を 大こと に開こうとしていたのを修正([265ba48](https://github.com/vvakame/prh/commit/265ba48))
* **techbooster.yml:** 良い例 を よい例 に開かないように調整 refs [#12](https://github.com/vvakame/prh/issues/12)([18f785a](https://github.com/vvakame/prh/commit/18f785a))



<a name="0.9.0"></a>
# [0.9.0](https://github.com/vvakame/prh/compare/0.8.0...v0.9.0) (2015-11-02)


### Features

* **prh:** add support regexpMustEmpty field. it is use for mimic of negative lookbehind ([28b025a](https://github.com/vvakame/prh/commit/28b025a))



<a name="0.8.0"></a>
# [0.8.0](https://github.com/vvakame/prh/compare/0.7.0...v0.8.0) (2015-10-25)

v0.8.0 has many BREAKING CHANGE.
sorry, it is not much in the future.

### Features

* **build:** add grunt-conventional-changelog ([b6f4511](https://github.com/vvakame/prh/commit/b6f4511))
* **prh:** implement imports feature ([b3f7214](https://github.com/vvakame/prh/commit/b3f7214))
* **prh:** improve class naming, rename Config to Engine refs #8 ([5f9d931](https://github.com/vvakame/prh/commit/5f9d931))
* **prh:** move function lib/changeset to ChangeSet class ([e87a1c6](https://github.com/vvakame/prh/commit/e87a1c6))
* **prh:** refactor ChangeSet. rename ChangeSet to Diff, create new ChangeType class. ([aa621e7](https://github.com/vvakame/prh/commit/aa621e7))
* **prh:** stop destructive change in ChangeSet#subtract ([19caf01](https://github.com/vvakame/prh/commit/19caf01))
