# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [5.0.1](https://github.com/azu/comment-to-assert/compare/v5.0.0...v5.0.1) (2019-09-01)

**Note:** Version bump only for package comment-to-assert





# [5.0.0](https://github.com/azu/comment-to-assert/compare/v4.1.2...v5.0.0) (2019-09-01)

**Note:** Version bump only for package comment-to-assert





# [4.0.0](https://github.com/azu/comment-to-assert/compare/v3.3.3...v4.0.0) (2019-09-01)

**Note:** Version bump only for package comment-to-assert





# [3.3.0](https://github.com/azu/comment-to-assert/compare/v3.2.1...v3.3.0) (2019-08-25)


### Features

* **power-doctes:** support power-assert again ([09632ec](https://github.com/azu/comment-to-assert/commit/09632ec))





# 3.0.0 (2019-08-25)


### Bug Fixes

* **assert:** fix handling of undefined or null ([#3](https://github.com/azu/comment-to-assert/issues/3)) ([daed652](https://github.com/azu/comment-to-assert/commit/daed652))
* **ast:** generate code with comment ([d950164](https://github.com/azu/comment-to-assert/commit/d950164))
* **error:** can handle ``// => *Error` ([628a26a](https://github.com/azu/comment-to-assert/commit/628a26a))
* **example:** run example then exit 0 ([c1348bc](https://github.com/azu/comment-to-assert/commit/c1348bc))
* **example:** use disableSourceMap option ([04c1e32](https://github.com/azu/comment-to-assert/commit/04c1e32))
* **lib:** fix TypeScript definition ([d32b124](https://github.com/azu/comment-to-assert/commit/d32b124))
* **node:** console.assert does not throw on Node.js 10 ([6a9a74a](https://github.com/azu/comment-to-assert/commit/6a9a74a))
* **npm:** fix npm test script ([a90ed9f](https://github.com/azu/comment-to-assert/commit/a90ed9f))
* **test:** remove undefined method ([333c81c](https://github.com/azu/comment-to-assert/commit/333c81c))
* **util:** #toAST return AST not Node ([308dbe8](https://github.com/azu/comment-to-assert/commit/308dbe8))
* **utils:** add missing extractionBody ([3bca03e](https://github.com/azu/comment-to-assert/commit/3bca03e))
* array and directive string expression support ([1a6efcd](https://github.com/azu/comment-to-assert/commit/1a6efcd))
* update node types ([6ad0195](https://github.com/azu/comment-to-assert/commit/6ad0195))


### Features

* **assert:** use `strictEqual` and `deepStrictEqual` ([#9](https://github.com/azu/comment-to-assert/issues/9)) ([85a4bed](https://github.com/azu/comment-to-assert/commit/85a4bed)), closes [#6](https://github.com/azu/comment-to-assert/issues/6)
* **ast:** implement replace comment with assert ([8925ada](https://github.com/azu/comment-to-assert/commit/8925ada))
* **ast:** support `asyncCallbackName` option ([#11](https://github.com/azu/comment-to-assert/issues/11)) ([a24e4ec](https://github.com/azu/comment-to-assert/commit/a24e4ec))
* **ast:** support block comment ([16f3cb2](https://github.com/azu/comment-to-assert/commit/16f3cb2))
* **ast:** support console api ([e1c7067](https://github.com/azu/comment-to-assert/commit/e1c7067))
* **bin:** add cli ([73701eb](https://github.com/azu/comment-to-assert/commit/73701eb))
* **comment:** Support object literal as comment ([9c138c7](https://github.com/azu/comment-to-assert/commit/9c138c7))
* **error:** support handling `Error: message` ([33f1b70](https://github.com/azu/comment-to-assert/commit/33f1b70))
* **example:** add example ([de07e6a](https://github.com/azu/comment-to-assert/commit/de07e6a))
* support NaN assert ([117daeb](https://github.com/azu/comment-to-assert/commit/117daeb))
* **lib:** Resolve: and Reject: support ([1169542](https://github.com/azu/comment-to-assert/commit/1169542))
* **options:** support assertBeforeCallbackName and assertAfterCallbackName ([2466b17](https://github.com/azu/comment-to-assert/commit/2466b17))
* **src:** support Promise comment ([#4](https://github.com/azu/comment-to-assert/issues/4)) ([b7882b5](https://github.com/azu/comment-to-assert/commit/b7882b5))
* **util:** add #wrapNode function ([36baa81](https://github.com/azu/comment-to-assert/commit/36baa81))


### BREAKING CHANGES

* **assert:** assertion is strict by default
