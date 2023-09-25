module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  plugins: ['jsdoc', 'prettier'],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  rules: {
    'prettier/prettier': 'warn',
    'jsdoc/no-undefined-types': 0,
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: 'req|next|err|error|res|_' },
    ],
    'no-duplicate-imports': 'error',
    'no-console': 'warn',
    '@typescript-eslint/no-var-requires': 'off',
  },
};
