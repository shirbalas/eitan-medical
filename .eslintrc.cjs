/** @type {import('eslint').Linter.Config} */
module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    parserOptions: { ecmaVersion: 2020, sourceType: 'module' },
    env: { node: true, es2021: true },
    plugins: ['@typescript-eslint'],
    extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
    overrides: [
      {
        files: ['**/*.spec.ts', '**/*.test.ts'],
        env: { jest: true },
        plugins: ['jest'],
        extends: ['plugin:jest/recommended'],
        rules: {
          '@typescript-eslint/unbound-method': 'off',
          'jest/unbound-method': 'off',
        },
      },
    ],
  };
  