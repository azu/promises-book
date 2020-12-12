# intelli-espower-loader [![Build Status](https://travis-ci.org/power-assert-js/intelli-espower-loader.svg?branch=master)](https://travis-ci.org/power-assert-js/intelli-espower-loader)

Handy node module for [power-assert](https://github.com/twada/power-assert "power-assert") and [espower-loader](https://github.com/twada/espower-loader " espower-loader").

## Installation

``` sh
npm install intelli-espower-loader --save-dev
```

You should also install [power-assert](https://github.com/twada/power-assert "power-assert").

```sh
npm install power-assert --save-dev 
```

## Usage

See [example/](example/)

### 1. (Optional) You have to set test directory to your `package.json`

``` json
{
    "name": "your-module",
    "description": "Your module",
    "version": "0.0.1",
    "directories": {
        "test": "test/"
    },
    "license": "MIT",
...
}
```

``` json
"directories": {
    "test": "test/"
}
```

If you didn't set directories.test, use `"test/"` as default value.

### 2. Run mocha with `intelli-espower-loader`

``` sh
mocha --require intelli-espower-loader
```

Run Test with [power-assert](https://github.com/twada/power-assert "power-assert") on the fly!!

![mocha](http://monosnap.com/image/GNvwDvnwXuUSvaGGZotBOeXwBATEfR.png)

![mocha with webstorm](http://monosnap.com/image/EKtgJNXyjzm32Ijiu7VubrZho4Rmc2.png)


## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## License

MIT
