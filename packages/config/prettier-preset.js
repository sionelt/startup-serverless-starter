module.exports = {
  bracketSameLine: true,
  jsxSingleQuote: false,
  semi: false,
  singleQuote: true,
  bracketSpacing: false,
  printWidth: 80,
  arrowParens: 'always',
  importOrder: ['<THIRD_PARTY_MODULES>', '^domain/(.*)$', '^[./]'],
  importOrderSeparation: false,
  importOrderSortSpecifiers: true,
  plugins: [require.resolve('@trivago/prettier-plugin-sort-imports')],
}
