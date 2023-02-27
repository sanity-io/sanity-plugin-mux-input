import {defineConfig} from '@sanity/pkg-utils'
import alias from '@rollup/plugin-alias'
import {createRequire} from 'node:module'

const require = createRequire(import.meta.url)

export default defineConfig({
  // @TODO stop pre-bundling @mux/mux-video-react once this is fixed https://github.com/video-dev/hls.js/issues/5146
  external: (externals) => externals.filter((e) => e !== '@mux/mux-video-react'),
  dist: 'lib',
  tsconfig: 'tsconfig.lib.json',
  // @TODO stop using the alias plugin, uninstall it and rollup once this is fixed https://github.com/video-dev/hls.js/issues/5146
  rollup: {
    plugins: [
      alias({
        entries: [
          {
            find: /(?<!\/)hls\.js(?!\/)/,
            replacement: require.resolve('hls.js/dist/hls.min'),
          },
        ],
      }),
    ],
  },

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
