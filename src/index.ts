import {definePlugin} from 'sanity'

import createStudioTool from './components/StudioTool'
import {muxVideoCustomRendering} from './plugin'
import {muxVideo, muxVideoAsset} from './schema'
import type {Config} from './util/types'

export type {VideoAssetDocument} from './util/types'

export const defaultConfig: Config = {
  mp4_support: 'none',
  max_resolution_tier: '1080p',
}

export const muxInput = definePlugin<Partial<Config> | void>((userConfig) => {
  const config: Config = {...defaultConfig, ...userConfig}
  return {
    name: 'mux-input',
    schema: {
      types: [
        muxVideoAsset,
        {
          ...muxVideo,
          ...muxVideoCustomRendering(config),
        },
      ],
    },
    tools: config.tool === false ? undefined : [createStudioTool(config)],
  }
})
