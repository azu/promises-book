# proofread-helper [![Circle CI](https://circleci.com/gh/prh/prh.svg?style=svg)](https://circleci.com/gh/prh/prh)

あなたの校正を手伝ってくれるライブラリ。

今まで、校正作業は主に編集のフェーズの作業でした。
これからは校正情報を編集者が作り、著者が執筆しながら自分で校正を行うようになります。

[![asciicast](https://asciinema.org/a/134406.png)](https://asciinema.org/a/134406)

## インストール

自分のライブラリに組み込んで使う場合。

```
$ npm install --save prh
```

コマンドラインツールとして使う場合。

```
$ npm install -g prh
```

## 利用方法

テキストファイルであれば、どのようなファイルであっても処理対象にすることができます。

```
$ prh --help
  Usage: prh [options] [command] [--] [files...]

  Options:

    --rules-json    emit rule set in json format
    --rules-yaml    emit rule set in yaml format
    --rules <path>  path to rule yaml file
    --verify        checking file validity
    --stdout        print replaced content to stdout
    --diff          show unified diff
    --verbose       makes output more verbose
    -r, --replace   replace input files


  Commands:

    init  generate prh.yml
```

実際に利用した場合の出力例。

```
# 校正前のファイル例
$ cat sample.md
# サンプルですよ

cookieとjqueryという表記は正しいだろうか？

# チェックにひっかかる箇所の表示
$ prh sample.md
sample.md(3,1): cookie → Cookie
sample.md(3,8): jquery → jQuery
```

校正ルールをオプションで指定しない場合、校正対象となるファイルと同じディレクトリ、またはそれより上の階層で最初に見つかったprh.ymlを利用します。
どのファイルに対してどの校正ルールが利用されているか確認したい場合、 `--verbose` オプションを利用してください。

### 設定ファイルについて

基本的な書き方については[misc/prh.yml](https://github.com/prh/prh/blob/master/misc/prh.yml)を参照してください。

実用するための設定ファイルは[prh/rulesのmedia/techbooster.yml](https://github.com/prh/rules/blob/master/media/techbooster.yml)がおすすめです。

その他、[prh/rules](https://github.com/prh/rules)に各種設定を取り揃えてあるので、好きに組み合わせてご利用ください。

`init` サブコマンドでbasicな設定ファイルを作成できます（実用には不向き）。

```
$ prh init
create prh.yml
see prh/rules collection https://github.com/prh/rules
```

実用上は `git submodule add https://github.com/prh/rules.git prh-rules` して好きなルールを使います。
これを参照するprh.ymlは次のように書きます。

```prh.yml
version: 1

imports:
  - ./prh-rules/media/techbooster.yml
```

### `--diff` オプション

unified diff形式で変更点を出力します。
[colordiff](https://www.colordiff.org/)と組み合わせると標準のレポートより見やすくなるかもしれません。

```
$ prh --diff sample.md
Index: sample.md
===================================================================
--- sample.md	before
+++ sample.md	replaced
@@ -1,4 +1,4 @@
 # サンプルですよ

-cookieとjqueryという表記は正しいだろうか？
+CookieとjQueryという表記は正しいだろうか？
```

### `--stdout` オプション

校正を適用した結果をstdoutに出力します。

```
$ prh --stdout sample.md
# サンプルですよ

CookieとjQueryという表記は正しいだろうか？
```

v3.x系まではこのオプションがデフォルトの振る舞いでした。

### `--verify` オプション

チェック結果をexit codeとして出力します。
文章のテストやCIなどに組み込む際に便利です。

```
$ prh --verify sample.md
Error: sample.md failed proofreading
    ....
$ echo $?
1
```

### `-r, --replace` オプション

指定したファイルの校正結果を直接ファイルに上書きします。

```
$ prh --replace sample.md
replaced sample.md

$ cat sample.md
# サンプルですよ

CookieとjQueryという表記は正しいだろうか？
```

### 修正点を意図的に無視させる

prh単体の利用ではMarkdownやRe:VIEWなどのファイルの構造は考慮できません。
そのため、URLの一部が変換されてしまったりします。
他にも意図的に指摘内容を無視したい場合があります。

そんな時、 `prh:disable` プラグマを使うことができます。
prhは文章を段落毎に処理し、段落にプラグマが含まれる場合大本のルールよりそちらの支持を優先します。
具体例を見ていきましょう。

```
#@# prh:disable
ここの段落は全く校正されない。

#@# prh:disable:web
web→Webの校正ルールがある場合。
ここの段落はwebというワードが含まれていても無視するよう指定されているので警告されない。

#@# prh:disable:web|jquery|[abc]
無視ルールは正規表現として解釈されるため複雑な条件も記述できる。

ルールは後置することもできる。
#@# prh:disable
```

こんな塩梅です。
この例はRe:VIEWのコメント記法を使っていますが、お使いのフォーマットでコメントと解釈される任意の構造を使うことができます。
Markdownであれば `<!-- prh:disable -->` とすることができます。
このため、無視するルールの記述に半角スペースを利用することができなくなっています。
代わりに `\s` などを使ってください。

## 関連ツール

Atomのプラグインである[language-review](https://atom.io/packages/language-review)に組み込まれています。
エディタ上で執筆を行うと自動的に校正候補が表示され、その結果を原稿に反映していくことができます。

[VSCodeの拡張](https://marketplace.visualstudio.com/items?itemName=vvakame.vscode-prh-extention)もあります。
これもエディタ上で執筆を行うと自動的に校正候補が表示され、QuickFixか全修正をさせることもできます。

azuさんが作成している[textlint](https://www.npmjs.com/package/textlint)のプラグインとして[textlint-rule-prh](https://www.npmjs.com/package/textlint-rule-prh)が作成されています。
