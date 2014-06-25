# Promises Book [![Build Status](https://travis-ci.org/azu/promises-book.png)](https://travis-ci.org/azu/promises-book) [![Gitter chat](https://badges.gitter.im/azu/promises-book.png)](https://gitter.im/azu/promises-book)

Promisesについての薄い電子書籍です

[http://azu.github.io/promises-book/](http://azu.github.io/promises-book/ "Promises book") から閲覧することが出来ます。

[http://azu.github.io/promises-book/javascript-promise-book.pdf](http://azu.github.io/promises-book/javascript-promise-book.pdf) からPDF版をダウンロードすることが出来ます。

[https://gumroad.com/l/javascript-promise](https://gumroad.com/l/javascript-promise "JavaScript Promiseの本 付録") からおまけのPDFを無料また任意の値段でダウンロードすることが出来ます。

寄付などがしたい方は、[こちら](https://gumroad.com/l/javascript-promise "JavaScript Promiseの本 付録")で代用して下さい。

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

フォントには[VL Gothic Font Family](http://vlgothic.dicey.org/ "VL Gothic Font Family")を使っています。
[VL Gothic Font Family](http://vlgothic.dicey.org/download.html "VL Gothic Font Family")からダウンロードしてインストールする必要があります。

必要なもの

* [VL Gothic Font Family](http://vlgothic.dicey.org/ "VL Gothic Font Family")
* Java

``` sh
git submodule update --init
make pdf
open javascript-promise-book.pdf
```

### Epubのビルド

まだ完成度が高くないため品質はよくありません。
[HTML版](http://azu.github.io/promises-book/)はスマートフォン等画面が小さくても見られるようになっているためそちらの利用を推奨します。

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