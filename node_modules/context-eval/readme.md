# context-eval

Simple execution context for node and the browser. In node it just creates a new
context and `runInContext` in that context and in the browser it creates an
iframe and hangs on to it until destroy is called.

install:

    npm install context-eval

Use with browserify or node.

to run the tests:

    npm test

test in browsers:

    npm install karma -g
    karma start


## new Context(sandbox, parentElement)

`sandbox` (optional) is an object that would be shallowly copied into the execution context.
`parentElement` (optional) is an element where the iframe can appended to, defautls to `body`.

## Context#evaluate(code)

Evaluates code and returns result.

## Context#destroy()

Does nothing in node but removes iframe in browser.

## Context#extend(obj)

Extend the global object with `obj`

## Context#getGlobal()

Returns the global object

### License

MIT