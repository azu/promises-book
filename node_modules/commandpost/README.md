# commandpost [![Circle CI](https://circleci.com/gh/vvakame/commandpost.png?style=badge)](https://circleci.com/gh/vvakame/commandpost)

commandpost is a command-line options parser.
This library is inspired by [commander](https://www.npmjs.com/package/commander).

commander is very user-friendly, but not [TypeScript](https://www.npmjs.com/package/typescript)-friendly.
commandpost aims to improve this.
Of course, commandpost can also be used from an ordinary JavaScript program. :+1:

## Installation

```
$ npm install --save commandpost
```

## How to Use

### Basic Usage

```
$ cat cli.ts
import * as commandpost from "commandpost";

let root = commandpost
	.create<{ spice: string[]; }, { food: string; }>("dinner <food>")
	.version("1.0.0", "-v, --version")
	.description("today's dinner!")
	.option("-s, --spice <name>", "What spice do you want? default: pepper")
	.action((opts, args) => {
		console.log(`Your dinner is ${args.food} with ${opts.spice[0] || "pepper"}!`);
	});

commandpost
	.exec(root, process.argv)
	.catch(err => {
		if (err instanceof Error) {
			console.error(err.stack);
		} else {
			console.error(err);
		}
		process.exit(1);
	});

$ node cli.js --help
  Usage: dinner [options] [--] <food>

  Options:

    -s, --spice <name>  What spice do you want? default: pepper

$ node cli.js -s "soy sause" "fillet steak"
Your dinner is fillet steak with soy sause!
```

### Commands

A top-level command is created by the `commandpost.create` function.

commandpost also supports sub-commands.
A sub-command is created by using the `topLevelCommand.subCommand` method.
Refer to [this](https://github.com/vvakame/commandpost/blob/master/example/usage.ts#L36) example for a demonstration.

commandpost can automatically generate help and command usage messages based on your configuration. For best results, it is recommended that you should set `.version` and `.description` for your top-level command.


### Options

```
// shorthand & formal option with a required parameter. value is converted to string[].
cmd.option("-c, --config <configFile>", "Read setting from specified config file path");

// option with optional parameter. value is converted to string[].
cmd.option("-c, --config [configFile]", "Read setting from specified config file path");

// option without parameter (flag). option value is converted to boolean and defaults to `false`.
cmd.option("--suppress-warning", "Suppress warning");

// option with `--no-` prefix. option value is converted to boolean and defaults to true.
cmd.option("--no-type-checking", "Type checking disabled");
```

If you want to handle unknown options, you can use the `.allowUnknownOption` method.

### Arguments

```
// required argument
commandpost.create<{}, { food: string; }>("dinner <food>");

// optional argument
commandpost.create<{}, { food: string; }>("dinner [food]");

// variadic argument
commandpost.create<{}, { foods: string[]; }>("dinner <food...>");
```

### Examples

* [example](https://github.com/vvakame/commandpost/blob/master/example/usage.ts) dir
* [typescript-formatter](https://github.com/vvakame/typescript-formatter/blob/master/lib/cli.ts)
* [dtsm](https://github.com/vvakame/dtsm/blob/master/lib/cli.ts)
* [review.js](https://github.com/vvakame/review.js/blob/master/lib/cli.ts)
* [prh](https://github.com/vvakame/prh/blob/master/lib/cli.ts)

## Contributing

This package's author, vvakame, is not a native English speaker. My first language is Japanese.
If you find incorrect English, please send me a pull request.
