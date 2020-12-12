# codemirror-console-ui

Web UI Components of [codemirror-console](../codemirror-console).

## Installation

``` sh
npm install codemirror-console-ui
```

## Usage

```js
import { attachToElement } from "codemirror-console-ui" 
const codeBlock = document.querySelector("code");
attachToElement(codeBlock, "default text", {
   state: "open",
   scrollIntoView: true
});
```

## How to custom Localization?

If you want to custom locale, please add translated text to [components/localization.js](components/localization.js).

1. Add translated text to [components/localization.js](components/localization.js)
2. Add lang(like "en", "ja") to [components/mirror-console-component.js](components/mirror-console-component.js)
3. Submit Pull Request!

## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## License

MIT
