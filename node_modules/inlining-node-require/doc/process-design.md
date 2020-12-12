# プロセス

`inlining(code)`

* `code` はentry pointとなるコード


*  entry pointから読み込んでる `require` 先を探索する
    * require先のファイルを読み込む


entry pointが `var add = require("./add");` となってる場合に、
require 先のファイルが `module.exports = Identifier` かどうかを見る。

**Identifier と同一の場合**

`Identifier == add` である場合、require先のファイルから `module.exports = ...` と
`var add = require("./add");` を削除する。

**Identifier と異なる場合**

`Identifier != add` である場合、require先のファイルから `module.exports = xxx` を削除
`var add = xxx` と変更する。

