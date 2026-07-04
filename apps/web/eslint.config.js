import eslintConfig from '@creative-factory/eslint-config/next.js';

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: ['.next', 'next-env.d.ts'],
  },
  ...eslintConfig,
];
