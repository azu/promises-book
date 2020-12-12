if (!require('has-template-literals')()) {
  require('babel-core/register')({
    plugins: ['transform-es2015-template-literals']
  })
}
