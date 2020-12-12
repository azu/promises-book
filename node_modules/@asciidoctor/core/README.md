# Asciidoctor core

This package provides Asciidoctor core functionality:

- parser
- built-in converters
- extensions

## Install

    $ npm i @asciidoctor/core --save

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
