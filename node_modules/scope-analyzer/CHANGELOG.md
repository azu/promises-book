# scope-analyzer change log

All notable changes to this project will be documented in this file.

This project adheres to [Semantic Versioning](http://semver.org/).

## 2.0.5 / 2018-06-25
* detect `catch(param){}` bindings

## 2.0.4 / 2018-05-22
* fix class method definition names being counted as references to outer variables.

## 2.0.3 / 2018-04-20
* revert to custom walker, acorn.walk behaviour is different and not faster

## 2.0.2 / 2018-04-20
* fix valid references that occur above a value is declared in source code

## 2.0.1 / 2018-03-30
* always initialise scope on the root node, so that undeclared names can be attached

## 2.0.0 / 2018-03-08

* add support for ES5 environments (Node 0.10+)
* `scan.getBinding()` now also returns bindings for undeclared identifiers. `binding.definition` will be undefined for undeclared identifiers.

## 1.3.0 / 2018-01-13

* add `binding.remove(node)` to remove a reference to a binding from the list of references. use `binding.isReferenced()` to check if there are any references left.

## 1.2.0 / 2018-01-02

* track uses of undeclared variable names. use `getUndeclaredNames()` on the root scope to get a list of undeclared names used in the AST.

## 1.1.1 / 2018-01-02

* fix `import { a as b }` being counted as a reference to `a`

## 1.1.0 / 2017-12-26

* account for import declarations
* rename `analyze` to `crawl` (analyze is still available as alias)
* some tests

## 1.0.0 / 2017-11-15

* initial release
