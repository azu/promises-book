# Promises Book [![Build Status](https://travis-ci.org/azu/promises-book.svg)](https://travis-ci.org/azu/promises-book) [![Gitter chat](https://badges.gitter.im/azu/promises-book.png)](https://gitter.im/azu/promises-book)

Promises小书电子版

在这里[http://azu.github.io/promises-book/](http://azu.github.io/promises-book/ "Promises book") 可以在线阅读。

也可以从这里[http://azu.github.io/promises-book/javascript-promise-book.pdf](http://azu.github.io/promises-book/javascript-promise-book.pdf) 下载PDF版。

你还可以从这里[https://gumroad.com/l/javascript-promise](https://gumroad.com/l/javascript-promise "JavaScript Promise小书 附录") 免费下载本书的附录，也可以自己设定价格购买，本附录记录了本书诞生的经纬。


如果你想捐赠的话，可以到[这里](https://gumroad.com/l/javascript-promise "JavaScript Promise小书 附录")。

## Installation

本书采用Asciidoc格式编写。

可以使用[Asciidoctor](http://asciidoctor.org/ "Asciidoctor")构建本书电子版。

### 编译为HTML

``` sh
(sudo) gem install asciidoctor coderay
(sudo) npm install -g gulp
npm install
make html
open index.html
```

### 编译为PDF

本书字体使用了[VL Gothic Font Family](http://vlgothic.dicey.org/ "VL Gothic Font Family")。
该字体可以从[VL Gothic Font Family](http://vlgothic.dicey.org/download.html "VL Gothic Font Family")下载，并需要进行安装。


所需软件

* [VL Gothic Font Family](http://vlgothic.dicey.org/ "VL Gothic Font Family")
* Java

``` sh
git submodule update --init
make pdf
open javascript-promise-book.pdf
```

### 编译为Epub

由于本书还不是特别完善，因此质量会很一般。
[HTML版](http://azu.github.io/promises-book/)在智能机等小画面尺寸的设备上也能很好的展现，所以推荐大家使用HTML方式阅读。


``` sh
gem install specific_install
gem specific_install -l https://github.com/opendevise/asciidoctor-epub3
asciidoctor-epub3 -D output index.adoc
```

## Contributing

欢迎各种Pull Request和Issue。

也可以到这里[![Gitter chat](https://badges.gitter.im/azu/promises-book.png)](https://gitter.im/azu/promises-book) 留言。

在Pull Request的时候请先参考 [CONTRIBUTING.md](CONTRIBUTING.md "CONTRIBUTING.md") 。

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## License

随书代码以MIT许可证发布。


图书内容则遵循<a rel="license" href="http://creativecommons.org/licenses/by-nc/4.0/">Creative Commons Attribution-NonCommercial</a>许可证。

<a rel="license" href="http://creativecommons.org/licenses/by-nc/4.0/"><img alt="Creative Commons License" style="border-width:0" src="http://i.creativecommons.org/l/by-nc/4.0/88x31.png" /></a>