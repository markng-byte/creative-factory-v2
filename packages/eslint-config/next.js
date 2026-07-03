const nextPlugin = require('@next/eslint-plugin-next');
const reactConfig = require('./react.js');

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  ...reactConfig,
  {
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  },
];
