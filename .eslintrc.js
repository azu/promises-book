module.exports = {
    "env": {
        "browser": true,
        "es6": true,
        "node": true,
        "mocha": true
    },
    "extends": "eslint:recommended",
    "globals": {
        "Atomics": "readonly",
        "SharedArrayBuffer": "readonly",
        "shouldFulfilled": "readonly",
        "shouldRejected": "readonly"
    },
    "parserOptions": {
        "ecmaVersion": 2018,
        "sourceType": "module"
    },

    "rules": {
        "one-var": ["error", "never"],
        "indent": [
            "error", 4, {
                "SwitchCase": 1
            }
        ],
        "quotes": ["error", "double", { "allowTemplateLiterals": true }],
        "array-bracket-spacing": [
            "error",
            "never"
        ],
        "brace-style": [
            "error",
            "1tbs"
        ],
        "block-spacing": "error",
        "comma-spacing": "error",
        "computed-property-spacing": "error",
        "no-whitespace-before-property": "error",
        // Object
        "object-curly-newline": ["off", "always"],
        "object-curly-spacing": ["error", "always"],
        "key-spacing": "error",
        "keyword-spacing": "error",
        "linebreak-style": ["error", "unix"],
        "no-multiple-empty-lines": "error",
        "rest-spread-spacing": "error",
        "semi": ["error", "always"],
        "semi-spacing": "error",
        "space-before-blocks": "error",
        "space-before-function-paren": ["error", "never"],
        "space-in-parens": "error",
        "space-infix-ops": "error",
        "space-unary-ops": "error",
        "spaced-comment": [
            "error", "always", {
                "exceptions": ["-", "=", "!"],
                "markers": [
                    "eslint",
                    "eslint-env",
                    "eslint-disable",
                    "eslint-enable",
                    "eslint-disable-line",
                    "eslint-disable-next-line",
                    "exported",
                    "globals",
                    "istanbul",
                    "!"
                ]
            }
        ],
        // const
        "prefer-const": "error",
        "no-var": "error",
        // arrow
        "prefer-arrow-callback": "error"
    }
};
