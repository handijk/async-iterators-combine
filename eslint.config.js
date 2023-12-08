import js from '@eslint/js';
import prettier from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  prettier,
  {
    ignores: ['dist', 'node_modules', 'coverage'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        setTimeout: true,
      },
    },
    rules: {
      'require-await': 'error',
      'require-yield': 'error',
      'no-return-await': 'error',
      'no-unused-vars': [
        'error',
        {
          args: 'all',
          caughtErrors: 'all',
          ignoreRestSiblings: false,
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          vars: 'all',
        },
      ],
    },
  },
];
