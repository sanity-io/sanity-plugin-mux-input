module.exports = {
  root: true,
  parser: 'sanipack/babel/eslint-parser',
  parserOptions: {
    requireConfigFile: false,
    babelOptions: {configFile: require.resolve('./.babelrc')},
  },
  extends: [
    'sanity',
    'sanity/react',
    'sanity/typescript',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  plugins: ['simple-import-sort'],
  rules: {
    'react/forbid-prop-types': 'off',
    'react/jsx-boolean-value': 'off',
    'react/jsx-no-bind': 'off',
    'react/no-did-mount-set-state': 'off',
    'react/prop-types': 'off',
    'simple-import-sort/imports': 'warn',
    'simple-import-sort/exports': 'warn',
  },
}
