module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
  },
  extends: [
    'react-app',
    'sanity/react', // must come before sanity/typescript
    'sanity/typescript',
    'plugin:react-hooks/recommended',
    'plugin:prettier/recommended',
  ],
  overrides: [
    {
      files: ['*.{ts,tsx}'],
      rules: {
        'no-undef': 0,
      },
    },
  ],
  plugins: ['simple-import-sort', 'prettier'],
  rules: {
    '@typescript-eslint/explicit-function-return-type': 0,
    '@typescript-eslint/explicit-module-boundary-types': 0,
    '@typescript-eslint/no-shadow': 'error',
    '@typescript-eslint/no-unused-vars': 1,
    'simple-import-sort/imports': 'warn',
    'simple-import-sort/exports': 'warn',
    'no-unused-vars': 0,
    'no-shadow': 'off',
    'react/display-name': 0,
    'react/jsx-no-bind': 0,
    'react/jsx-handler-names': 0,
    camelcase: 0,
    'symbol-description': 0,
    'no-void': 0,
  },
  settings: {
    'import/ignore': ['\\.css$', '.*node_modules.*'],
    'import/resolver': {
      node: {
        paths: ['src'],
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
}
