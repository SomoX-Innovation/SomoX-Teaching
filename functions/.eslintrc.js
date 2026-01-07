/* eslint-env node */
module.exports = {
  env: {
    es6: true,
    node: true,
    commonjs: true,
  },
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: "script",
  },
  extends: [
    "eslint:recommended",
    "google",
  ],
  rules: {
    "no-restricted-globals": ["error", "name", "length"],
    "prefer-arrow-callback": "error",
    "quotes": ["error", "double", {"allowTemplateLiterals": true}],
    "require-jsdoc": "off",
    "max-len": ["error", {"code": 120}],
    "no-undef": "off", // Node.js globals are handled by env
  },
  overrides: [
    {
      files: ["**/*.spec.*"],
      env: {
        mocha: true,
      },
      rules: {},
    },
  ],
};
