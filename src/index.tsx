import {createPlugin} from 'sanity'

import {name} from './constants'
import muxVideo from './schema/mux.video'
import videoAsset from './schema/mux.videoAsset'

export const muxInput = createPlugin(() => ({
  name,
  schema: {
    types: [muxVideo, videoAsset],
  },
}))
