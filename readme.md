# Promises Book [![Build Status](https://travis-ci.org/azu/promises-book.png)](https://travis-ci.org/azu/promises-book) [![Gitter chat](https://badges.gitter.im/azu/promises-book.png)](https://gitter.im/azu/promises-book)

Promisesについての薄い電子書籍です

[http://azu.github.io/promises-book/](http://azu.github.io/promises-book/ "Promises book") から閲覧することが出来ます。

## Installation

この書籍はAsciidocフォーマットで書かれています。

[Asciidoctor](http://asciidoctor.org/ "Asciidoctor")でビルドすることが出来ます。

### HTMLのビルド

``` sh
gem install asciidoctor coderay
npm install -g gulp
npm install
make html
open index.html
```

### PDFのビルド

フォルトには[VL Gothic Font Family](http://vlgothic.dicey.org/ "VL Gothic Font Family")を使っています。
[VL Gothic Font Family](http://vlgothic.dicey.org/download.html "VL Gothic Font Family")からダウンロードしてインストールする必要があります。

必要なもの

* [VL Gothic Font Family](http://vlgothic.dicey.org/ "VL Gothic Font Family")
* Java

``` sh
git submodule update --init
make pdf
open index.pdf
```

### Epubのビルド

``` sh
gem install specific_install
gem specific_install -l https://github.com/opendevise/asciidoctor-epub3
asciidoctor-epub3 -D output index.adoc
```

## Contributing

Pull RequestやIssue等お気軽にどうぞ。

[![Gitter chat](https://badges.gitter.im/azu/promises-book.png)](https://gitter.im/azu/promises-book) に書き込むだけでも問題ないです。

Pull Requestする場合は [CONTRIBUTE.md](CONTRIBUTE.md "CONTRIBUTE.md") も参考にして下さい。

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## License

プログラムコードはMITライセンスで利用できます。

文章については<a rel="license" href="http://creativecommons.org/licenses/by-nc/4.0/">Creative Commons Attribution-NonCommercial</a>で利用できます。

<a rel="license" href="http://creativecommons.org/licenses/by-nc/4.0/"><img alt="クリエイティブ・コモンズ・ライセンス" style="border-width:0" src="http://i.creativecommons.org/l/by-nc/4.0/88x31.png" /></a>