import globals from 'globals';
import pluginJs from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';

export default [
  {
    plugins: {
      '@stylistic': stylistic,
    },
    rules: {
      'no-empty': ['error', { allowEmptyCatch: true }],
      '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
      '@stylistic/linebreak-style': ['error', 'unix'],
      '@stylistic/eol-last': ['error', 'always'],
      '@stylistic/indent': ['error', 2],
      'unicode-bom': ['error', 'never'],
    },
    languageOptions: {
      sourceType: 'module', // Change this to 'module'
      globals: {
        ...globals.browser,
        ...globals.node,
        process: 'readonly',
      },
    },
  },
  pluginJs.configs.recommended,
];
