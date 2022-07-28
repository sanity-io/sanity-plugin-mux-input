import {createPlugin} from 'sanity'

import muxVideo from './schema/mux.video'
import videoAsset from './schema/mux.videoAsset'

export const muxInput = createPlugin(() => ({
  name: 'mux-input',
  schema: {
    types: [muxVideo, videoAsset],
  },
}))

export {default as Preview} from './components/Preview'
// @TODO add this export
// export {default as Input} from './components/Input'
