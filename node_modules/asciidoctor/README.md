# Asciidoctor.js: AsciiDoc in JavaScript powered by Asciidoctor

Asciidoctor.js brings AsciiDoc to the JavaScript world!

This project uses [Opal](https://opalrb.com/) to transpile [Asciidoctor](http://asciidoctor.org), a modern implementation of AsciiDoc, from Ruby to JavaScript to produce _asciidoctor.js_.
The _asciidoctor.js_ script can be run on any JavaScript platform, including Node.js, GraalVM and, of course, a web browser.

## Install

    $ npm i asciidoctor --save

## Usage

Here is a simple example that converts AsciiDoc to HTML5:

**sample.js**

```javascript
const asciidoctor = require('asciidoctor')() // <1>
const content = 'http://asciidoctor.org[*Asciidoctor*] ' +
  'running on https://opalrb.com[_Opal_] ' +
  'brings AsciiDoc to Node.js!'
const html = asciidoctor.convert(content) // <2>
console.log(html) // <3>
```
- <1> Instantiate the Asciidoctor.js library
- <2> Convert AsciiDoc content to HTML5 using Asciidoctor.js
- <3> Print the HTML5 output to the console

Save the file as _sample.js_ and run it using the `node` command:

    $ node sample.js

You should see the following output in your terminal:

```html
<div class="paragraph">
<p><a href="http://asciidoctor.org"><strong>Asciidoctor</strong></a> running on <a href="http://opalrb.com"><em>Opal</em></a> brings AsciiDoc to Node.js!</p>
</div>
```

If you want to know more about Asciidoctor.js, please read the [User Manual](https://asciidoctor-docs.netlify.com/asciidoctor.js/).

## Contributing

In the spirit of [free software](https://www.gnu.org/philosophy/free-sw.html), _everyone_ is encouraged to help improve this project.
If you discover errors or omissions in the source code, documentation, or website content, please don't hesitate to submit an issue or open a pull request with a fix.
New contributors are always welcome!

The [Contributing](https://github.com/asciidoctor/asciidoctor.js/blob/master/CONTRIBUTING.adoc) guide provides information on how to contribute.

If you want to write code, the [Contributing Code](https://github.com/asciidoctor/asciidoctor.js/blob/master/CONTRIBUTING-CODE.adoc) guide will help you to get started quickly.

## Copyright

Copyright (C) 2019 Dan Allen, Guillaume Grossetie, Anthonny Quérouil and the Asciidoctor Project.
Free use of this software is granted under the terms of the MIT License.

See the [LICENSE](https://github.com/asciidoctor/asciidoctor.js/blob/master/LICENSE) file for details.