# in-browser-language

This module is designed to be used with browserify or other CJS bundlers.

```npm i in-browser-language --save```

## How it works

The module checks for (in order) :

* `window.navigator.languages`
* `window.navigator.language`
* `window.clientInformation.userLanguage`
* `window.clientInformation.browserLanguage`
* `window.clientInformation.systemLanguage`

Some systems / browser may actually return the language of the OS instead of the language of the browser.

There is no way around this issue but it can be mitigated by allowing the user to change its language.

## Methods

**list()**

Return an array containing the languages.

**first()**

Return the first language of the list.

**pick(proposedLanguages, defaultLanguage)**

Pick the first language found both in the `proposedLanguages` array and the list of languages supported by the browser.

If there are no matches, the defaultLanguage is returned.

```js
var browserLanguage = require('in-browser-language');

console.log(browserLanguage.list());
// returns ['fr', 'en']

console.log(browserLanguage.first());
// returns 'fr'

console.log(browserLanguage.pick(['pl', 'ja', 'en', 'fr']));
// returns 'fr' as 'fr' is the first declared by the browser

console.log(browserLanguage.pick(['pl', 'ja'], 'pl'));
// returns 'pl' as there are no matches

console.log(browserLanguage.pick(['pl', 'ja']));
// returns null as there are no matches and no defaultLanguage
```

