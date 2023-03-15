module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
    node: true,
  },
  extends: ['eslint:recommended', 'plugin:prettier/recommended'],
  plugins: ['jsdoc', 'prettier'],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  rules: {
    'prettier/prettier': 'warn',
    'jsdoc/no-undefined-types': 1,
    'no-unused-vars': [
      'warn',
      { argsIgnorePattern: 'req|next|err|error|res|_' },
    ],
    'no-duplicate-imports': 'error',
    'no-console': 'warn',
  },
};
