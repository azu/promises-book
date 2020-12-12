var bench = require('nanobench')
var parse = require('acorn').parse
var scan = require('../')
var src = require('fs').readFileSync(require.resolve('d3/build/d3'), 'utf8')

bench('scope-analyze d3', function (b) {
  var ast = parse(src)

  b.start()
  scan.crawl(ast)
  b.end()
})
