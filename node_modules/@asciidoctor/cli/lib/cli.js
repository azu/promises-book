/* global Opal */
'use strict'

const yargs = require('yargs')
const fs = require('fs')
const ospath = require('path')
const asciidoctor = require('@asciidoctor/core')()
const pkg = require('../package.json')
const stdin = require('./stdin')

const DOT_RELATIVE_RX = new RegExp(`^\\.{1,2}[/${ospath.sep.replace('/', '').replace('\\', '\\\\')}]`)

function convertOptions (args) {
  const backend = args['backend']
  const doctype = args['doctype']
  const safeMode = args['safe-mode']
  // "--no-header-footer" is translated to header-footer = false but the alias "-s" is translated to no-header-footer = true
  const noHeaderFooter = args['header-footer'] === false || args['no-header-footer'] === true
  const embedded = args['embedded'] === true
  const sectionNumbers = args['section-numbers']
  const baseDir = args['base-dir']
  const destinationDir = args['destination-dir']
  const outFile = args['out-file']
  const quiet = args['quiet']
  const verbose = args['verbose']
  const timings = args['timings']
  const trace = args['trace']
  const requireLib = args['require']
  const standalone = !(noHeaderFooter === true || embedded === true)
  let level = args['failure-level'].toUpperCase()
  if (level === 'WARNING') {
    level = 'WARN'
  }
  const failureLevel = asciidoctor.LoggerSeverity[level]
  if (verbose) {
    console.log('require ' + requireLib)
    console.log('backend ' + backend)
    console.log('doctype ' + doctype)
    console.log('no-header-footer ' + noHeaderFooter)
    console.log('embedded ' + embedded)
    console.log('standalone ' + standalone)
    console.log('section-numbers ' + sectionNumbers)
    console.log('failure-level ' + level)
    console.log('quiet ' + quiet)
    console.log('verbose ' + verbose)
    console.log('timings ' + timings)
    console.log('trace ' + trace)
    console.log('base-dir ' + baseDir)
    console.log('destination-dir ' + destinationDir)
  }
  const verboseMode = quiet ? 0 : verbose ? 2 : 1
  const attributes = []
  if (sectionNumbers) {
    attributes.push('sectnums')
  }
  const cliAttributes = args['attribute']
  if (cliAttributes) {
    attributes.push(...cliAttributes)
  }
  if (verbose) {
    console.log('verbose-mode ' + verboseMode)
    console.log('attributes ' + attributes)
  }
  const options = {
    backend: backend,
    doctype: doctype,
    safe: safeMode,
    standalone: standalone,
    failure_level: failureLevel,
    verbose: verboseMode,
    timings: timings,
    trace: trace
  }
  if (baseDir != null) {
    options.base_dir = baseDir
  }
  if (destinationDir != null) {
    options.to_dir = destinationDir
  }
  if (outFile) {
    if (outFile === '') {
      options.to_file = '-'
    } else {
      options.to_file = outFile
      options.mkdirs = true
    }
  } else {
    options.mkdirs = true
  }
  options.attributes = attributes
  if (verbose) {
    console.log('options ' + JSON.stringify(options))
  }
  if (options.to_file === '-') {
    options.to_file = Opal.gvars.stdout
  }
  return options
}

function argsParser () {
  return yargs
    .detectLocale(false)
    .wrap(Math.min(120, yargs.terminalWidth()))
    .command('$0 [files...]', '', function (yargs) {
      return yargs
        .option('backend', {
          alias: 'b',
          default: 'html5',
          describe: 'set output format backend',
          type: 'string'
        })
        .option('doctype', {
          alias: 'd',
          default: 'article',
          describe: 'document type to use when converting document',
          choices: ['article', 'book', 'manpage', 'inline']
        })
        .option('out-file', {
          alias: 'o',
          describe: 'output file (default: based on path of input file) use \'\' to output to STDOUT',
          type: 'string'
        })
        .option('safe-mode', {
          alias: 'S',
          default: 'unsafe',
          describe: 'set safe mode level explicitly, disables potentially dangerous macros in source files, such as include::[]',
          choices: ['unsafe', 'safe', 'server', 'secure']
        })
        .option('embedded', {
          alias: 'e',
          default: false,
          describe: 'suppress enclosing document structure and output an embedded document',
          type: 'boolean'
        })
        .option('no-header-footer', {
          alias: 's',
          default: false,
          describe: 'suppress enclosing document structure and output an embedded document',
          type: 'boolean'
        })
        .option('section-numbers', {
          alias: 'n',
          default: false,
          describe: 'auto-number section titles in the HTML backend disabled by default',
          type: 'boolean'
        })
        .option('base-dir', {
          // QUESTION: should we check that the directory exists ? coerce to a directory ?
          alias: 'B',
          describe: 'base directory containing the document and resources (default: directory of source file)',
          type: 'string'
        })
        .option('destination-dir', {
          // QUESTION: should we check that the directory exists ? coerce to a directory ?
          alias: 'D',
          describe: 'destination output directory (default: directory of source file)',
          type: 'string'
        })
        .option('failure-level', {
          default: 'FATAL',
          describe: 'set minimum logging level that triggers non-zero exit code',
          choices: ['info', 'INFO', 'warn', 'WARN', 'warning', 'WARNING', 'error', 'ERROR', 'fatal', 'FATAL']
        })
        .option('quiet', {
          alias: 'q',
          default: false,
          describe: 'suppress warnings',
          type: 'boolean'
        })
        .option('trace', {
          default: false,
          describe: 'include backtrace information on errors',
          type: 'boolean'
        })
        .option('verbose', {
          alias: 'v',
          default: false,
          describe: 'enable verbose mode',
          type: 'boolean'
        })
        .option('timings', {
          alias: 't',
          default: false,
          describe: 'enable timings mode',
          type: 'boolean'
        })
        .option('attribute', {
          alias: 'a',
          array: true,
          describe: 'a document attribute to set in the form of key, key! or key=value pair',
          type: 'string'
        })
        .option('require', {
          alias: 'r',
          array: true,
          describe: 'require the specified library before executing the processor, using the standard Node require',
          type: 'string'
        })
        .option('version', {
          alias: 'V',
          default: false,
          describe: 'display the version and runtime environment (or -v if no other flags or arguments)',
          type: 'boolean'
        })
        .option('help', {
          describe: `print a help message
show this usage if TOPIC is not specified or recognized
show an overview of the AsciiDoc syntax if TOPIC is syntax`,
          type: 'string'
        })
        .nargs('attribute', 1)
        .nargs('require', 1)
        .usage(`$0 [options...] files...
Translate the AsciiDoc source file or file(s) into the backend output format (e.g., HTML 5, DocBook 5, etc.)
By default, the output is written to a file with the basename of the source file and the appropriate extension`)
        .example('$0 -b html5 doc.asciidoc', 'convert an AsciiDoc file to HTML5; result will be written in a file named doc.html')
        .epilogue('For more information, please visit https://asciidoctor.org/docs')
    })
    .version(false)
    .help(false)
}

function convertFromStdin (options, args) {
  stdin.read((data) => {
    if (args['timings']) {
      const timings = asciidoctor.Timings.$new()
      const instanceOptions = Object.assign({}, options, { timings: timings })
      convert(asciidoctor.convert, data, instanceOptions)
      timings.$print_report(Opal.gvars.stderr, '-')
    } else {
      convert(asciidoctor.convert, data, options)
    }
  })
}

function convert (processorFn, input, options) {
  try {
    processorFn.apply(asciidoctor, [input, options])
  } catch (e) {
    if (e && e.name === 'NotImplementedError' && e.message === `asciidoctor: FAILED: missing converter for backend '${options.backend}'. Processing aborted.`) {
      console.error(`> Error: missing converter for backend '${options.backend}'. Processing aborted.`)
      console.error(`> You might want to require a Node.js package with --require option to support this backend.`)
      process.exit(1)
    }
    throw e
  }
}

function convertFile (file, options) {
  convert(asciidoctor.convertFile, file, options)
}

function processFiles (files, verbose, timings, options) {
  files.forEach(function (file) {
    if (verbose) {
      console.log(`converting file ${file}`)
    }
    if (timings) {
      const timings = asciidoctor.Timings.$new()
      const instanceOptions = Object.assign({}, options, { timings: timings })
      convertFile(file, instanceOptions)
      timings.$print_report(Opal.gvars.stderr, file)
    } else {
      convertFile(file, options)
    }
  })
  let code = 0
  const logger = asciidoctor.LoggerManager.getLogger()
  if (logger && typeof logger.getMaxSeverity === 'function' && logger.getMaxSeverity() && logger.getMaxSeverity() >= options['failure_level']) {
    code = 1
  }
  process.exit(code)
}

function requireLibrary (requirePath, cwd = process.cwd()) {
  if (requirePath.charAt(0) === '.' && DOT_RELATIVE_RX.test(requirePath)) {
    // NOTE require resolves a dot-relative path relative to current file; resolve relative to cwd instead
    requirePath = ospath.resolve(requirePath)
  } else if (!ospath.isAbsolute(requirePath)) {
    // NOTE appending node_modules prevents require from looking elsewhere before looking in these paths
    const paths = [cwd, ospath.dirname(__dirname)].map((start) => ospath.join(start, 'node_modules'))
    requirePath = require.resolve(requirePath, { paths })
  }
  return require(requirePath)
}

function prepareProcessor (argv, asciidoctor) {
  const requirePaths = argv['require']
  if (requirePaths) {
    requirePaths.forEach(function (requirePath) {
      const lib = requireLibrary(requirePath)
      if (lib && typeof lib.register === 'function') {
        // REMIND: it could be an extension or a converter.
        // the register function on a converter does not take any argument
        // but the register function on an extension expects one argument (the extension registry)
        // Until we revisit the API for extension and converter, we pass the registry as the first argument
        lib.register(asciidoctor.Extensions)
      }
    })
  }
}

function run (argv) {
  const processArgs = argv.slice(2)
  const args = argsParser().parse(processArgs)
  const verbose = args['verbose']
  const version = args['version']
  const files = args['files']
  if (version || (verbose && processArgs.length === 1)) {
    console.log(`Asciidoctor.js ${asciidoctor.getVersion()} (Asciidoctor ${asciidoctor.getCoreVersion()}) [https://asciidoctor.org]`)
    const releaseName = process.release ? process.release.name : 'node'
    console.log(`Runtime Environment (${releaseName} ${process.version} on ${process.platform})`)
    console.log(`CLI version ${pkg.version}`)
    process.exit(0)
  }
  prepareProcessor(args, asciidoctor)
  const stdin = files && files.length === 0 && processArgs[processArgs.length - 1] === '-'
  if (stdin) {
    args['out-file'] = args['out-file'] || '-'
  }
  const options = convertOptions(args)
  if (stdin) {
    convertFromStdin(options, args)
  } else if (files && files.length > 0) {
    processFiles(files, verbose, args['timings'], options)
  } else {
    if (args['help'] === 'syntax') {
      console.log(fs.readFileSync(ospath.join(__dirname, '..', 'data', 'reference', 'syntax.adoc'), 'utf8'))
    } else {
      yargs.showHelp()
    }
  }
}

module.exports = {
  run: run,
  argsParser: argsParser,
  convertOptions: convertOptions,
  processFiles: processFiles,
  processor: asciidoctor,
  prepareProcessor: prepareProcessor
}
