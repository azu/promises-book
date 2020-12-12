var Set = require('es6-set')

module.exports = Binding

function Binding (name, definition) {
  this.name = name
  this.definition = definition
  this.references = new Set()

  if (definition) this.add(definition)
}

Binding.prototype.add = function (node) {
  this.references.add(node)
  return this
}

Binding.prototype.remove = function (node) {
  if (!this.references.has(node)) {
    throw new Error('Tried removing nonexistent reference')
  }
  this.references.delete(node)
  return this
}

Binding.prototype.isReferenced = function () {
  var definition = this.definition
  var isReferenced = false
  this.each(function (ref) {
    if (ref !== definition) isReferenced = true
  })
  return isReferenced
}

Binding.prototype.getReferences = function () {
  var arr = []
  this.each(function (ref) { arr.push(ref) })
  return arr
}

Binding.prototype.each = function (cb) {
  this.references.forEach(function (ref) { cb(ref) })
  return this
}
