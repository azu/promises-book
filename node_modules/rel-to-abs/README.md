Given an HTML source, it will convert any URL on links, images, scripts, etc to abosulte URLs.

## Install

		npm install rel-to-abs

## Usage

		var converter = require('rel-to-abs');

		var converted = converter.convert('<img src="foo.png">', 'http://mysite.com');

		## <img src="http://mysite.com">

Credits

<http://stackoverflow.com/questions/7544550/javascript-regex-to-change-all-relative-urls-to-absolute>