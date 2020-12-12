# codemirror-console [![Build Status](https://travis-ci.org/azu/codemirror-console.svg)](https://travis-ci.org/azu/codemirror-console)

This library add `Console` to [CodeMirror](http://codemirror.net/ "CodeMirror").

This library could execute CodeMirror editor's code.

## Installation

```sh
npm install codemirror-console
```

If you want to use it as UI library, please use [codemirror-console-ui](../codemirror-console-ui/) instead of it.

## Usage

open index.html

``` js
var MirrorConsole = require("mirror-console");
var content = document.querySelector(".content");
var editor = new MirrorConsole();
editor.setText(content.textContent);
editor.swapWithElement(content); // insert editor
var consoleMock = {
    log: function (arg) {
        function line(text) {
            var div = document.createElement("div");
            div.appendChild(document.createTextNode(text));
            return div;
        }
        document.getElementById("output").appendChild(line(arg));
    }
}
// eval code
editor.runInContext({ console: consoleMock }, function (error, result) {
    if (error) {
        console.error(error);
    }
});
editor.destroy();// remote editor
```
## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## License

MIT
