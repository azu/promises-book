# Asciidoctor.js: AsciiDoc in JavaScript powered by Asciidoctor

![Travis build status](https://img.shields.io/travis/asciidoctor/asciidoctor.js/master.svg)
![Appveyor build status](https://ci.appveyor.com/api/projects/status/i69sqvvyr95sf6i7/branch/master?svg=true)
![npm version](https://img.shields.io/npm/v/asciidoctor.js.svg)
![jsDelivr stats](https://data.jsdelivr.com/v1/package/npm/asciidoctor.js/badge?style=rounded)
![cdnjs](https://img.shields.io/cdnjs/v/asciidoctor.js.svg)
![JSDoc](https://img.shields.io/badge/jsdoc-master-blue.svg)
![InchCI](https://inch-ci.org/github/asciidoctor/asciidoctor.js.svg?branch=master)

Asciidoctor.js brings AsciiDoc to the JavaScript world!

This project uses [Opal](https://opalrb.com) to transpile [Asciidoctor](http://asciidoctor.org), a modern implementation of AsciiDoc, from Ruby to JavaScript to produce _asciidoctor.js_.
The _asciidoctor.js_ script can be run on any JavaScript platform, including Node.js, Nashorn and, of course, a web browser.

**IMPORTANT:** Asciidoctor.js does _not_ use Semantic Versioning as the release versions are aligned on _Asciidoctor (Ruby)_. It's *highly recommended* to define the exact version in your `package.json` file (ie. without `^`). Please read the release notes when upgrading to the latest version as breaking changes can be introduced in non major release.

## Introduction

You can use Asciidoctor.js either for back-end development using [Node.js](https://nodejs.org) or front-end development using a browser.

## Front-end development

**Installing Asciidoctor.js with npm**

    $ npm install asciidoctor.js --save

Once the package installed, you can add the following `script` tag to your HTML page:

```html
<script src="node_modules/asciidoctor.js/dist/browser/asciidoctor.js"></script>
```

Here is a simple example that converts AsciiDoc to HTML5:

**sample.js**

```javascript
var asciidoctor = Asciidoctor(); // <1>
var content = "http://asciidoctor.org[*Asciidoctor*] " +
    "running on https://opalrb.com[_Opal_] " +
    "brings AsciiDoc to the browser!";
var html = asciidoctor.convert(content); // <2>
console.log(html); // <3>
```

<1> Instantiate the Asciidoctor.js library
<2> Convert AsciiDoc content to HTML5 using Asciidoctor.js
<3> Print the HTML5 output to the console

## Back-end development

**Installing Asciidoctor.js with npm**

    $ npm install asciidoctor.js --save

Once the package is installed, the first thing to do is to load the `asciidoctor.js` module using `require`, then you're ready to start using the API:

**sample.js**

```javascript
var asciidoctor = require('asciidoctor.js')(); // <1>
var content = "http://asciidoctor.org[*Asciidoctor*] " +
    "running on https://opalrb.com[_Opal_] " +
    "brings AsciiDoc to Node.js!";
var html = asciidoctor.convert(content); // <2>
console.log(html); // <3>
```

<1> Instantiate the Asciidoctor.js library
<2> Convert AsciiDoc content to HTML5 using Asciidoctor.js
<3> Print the HTML5 output to the console

Save the file as `sample.js` and run it using the `node` command:

 $ node sample.js

You should see the following output in your terminal:


    <div class="paragraph">
    <p><a href="http://asciidoctor.org"><strong>Asciidoctor</strong></a> running on <a href="http://opalrb.com"><em>Opal</em></a> brings AsciiDoc to Node.js!</p>
    </div>

## Advanced topics

If you want to know more about _Asciidoctor.js_, please read the [User Manual](https://asciidoctor-docs.netlify.com/asciidoctor.js/).

## Contributing

In the spirit of [free software](https://www.gnu.org/philosophy/free-sw.html), _everyone_ is encouraged to help improve this project.
If you discover errors or omissions in the source code, documentation, or website content, please don't hesitate to submit an issue or open a pull request with a fix.
New contributors are always welcome!

The [Contributing](https://github.com/asciidoctor/asciidoctor.js/blob/master/CONTRIBUTING.adoc) guide provides information on how to contribute.

If you want to write code, the [Contributing Code](https://github.com/asciidoctor/asciidoctor.js/blob/master/CONTRIBUTING-CODE.adoc) guide will help you to get started quickly.

## Copyright

Copyright (C) 2018 Dan Allen, Guillaume Grossetie, Anthonny Quérouil and the Asciidoctor Project.
Free use of this software is granted under the terms of the MIT License.

See the [LICENSE](https://github.com/asciidoctor/asciidoctor.js/blob/master/LICENSE) file for details.
