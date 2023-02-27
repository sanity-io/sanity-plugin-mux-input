import {defineConfig} from '@sanity/pkg-utils'

export default defineConfig({
  // @TODO stop pre-bundling @mux/mux-video-react once this is fixed https://github.com/video-dev/hls.js/issues/5146
  external: (externals) => externals.filter((e) => e !== '@mux/mux-video-react'),
  dist: 'lib',
  tsconfig: 'tsconfig.lib.json',

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
