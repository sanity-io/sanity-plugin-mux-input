import {defineConfig} from '@sanity/pkg-utils'

export default defineConfig({
  dist: 'dist',
  tsconfig: 'tsconfig.dist.json',

  external: (prev) => prev.filter((dep) => dep !== 'use-error-boundary'),

  // Remove this block to enable strict export validation
  extract: {
    rules: {
      'ae-forgotten-export': 'off',
      'ae-incompatible-release-tags': 'off',
      'ae-internal-missing-underscore': 'off',
      'ae-missing-release-tag': 'off',
    },
  },
})
