var bench = require('nanobench')
var parse = require('acorn').parse
var scan = require('../')
var src = require('fs').readFileSync(require.resolve('three'), 'utf8')

bench('scope-analyze three.js', function (b) {
  var ast = parse(src)

  b.start()
  scan.crawl(ast)
  b.end()
})
