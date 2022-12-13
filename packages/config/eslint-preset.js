module.exports = {
  root: true,
  extends: ['plugin:prettier/recommended', 'turbo'],
  parserOptions: {
    project: [
      './tsconfig.json',
      './apps/*/tsconfig.json',
      './packages/*/tsconfig.json',
    ],
  },
  rules: {},
  ignorePatterns: ['*.cjs', '*.mjs'],
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      extends: ['plugin:@typescript-eslint/recommended'],
      plugins: ['@typescript-eslint'],
      parser: '@typescript-eslint/parser',
      rules: {
        '@typescript-eslint/no-empty-interface': 'off',
        '@typescript-eslint/no-empty-function': 'off',
      },
    },
  ],
}
