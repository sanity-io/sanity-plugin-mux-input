import {defineConfig} from '@sanity/pkg-utils'

export default defineConfig({
  dist: 'lib',
  // Remove this block to enable strict export validation
  extract: {
    rules: {
      'ae-forgotten-export': 'warn',
      'ae-incompatible-release-tags': 'warn',
      'ae-internal-missing-underscore': 'warn',
      'ae-missing-release-tag': 'warn',
    },
  },
})
