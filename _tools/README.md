# ツール

## setup-git.sh

travisのgit config

## build.sh

asciidoctorのhtmlラッパ

## build_pdf.sh

asciidoctor + fopubのラッパ

- fopub-config/custom-config.xml を使うときに書き換えてからビルドする
- pdf が書き出されたらfopubを元に戻す
- `custom-config.xml` のフォントの位置はワーキングディレクトリからの相対であることを利用
- `fonts` ディレクトリのフォントを使えるようにしてる

## cli-book-version.js

- package.jsonのバージョンを文字列で取るだけ
- asciidoctorの変数で渡してhtmlやpdfにバージョンを埋め込んでる

## deploy-gh-pages.sh

gh-pagesへコミット

## cli-inject-meta.js

preview-html用なのでもう使ってない

## cli-rel-to-abs.js

preview-html用なのでもう使ってない

## deploy-preview-html.sh

preview-htmlブランチにpush