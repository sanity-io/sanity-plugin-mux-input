import {definePlugin} from 'sanity'
import createStudioTool, {DEFAULT_TOOL_CONFIG} from '../components/StudioTool'
import {muxVideoCustomRendering} from '../plugin'
import {muxVideo, muxVideoAsset} from '../schema'
import type {PluginConfig} from '../util/types'
export type {VideoAssetDocument} from '../util/types'

export const defaultConfig: PluginConfig = {
  mp4_support: 'none',
  encoding_tier: 'smart',
  max_resolution_tier: '1080p',
  defaultSigned: false,
  tool: DEFAULT_TOOL_CONFIG,
}

export const muxInput = definePlugin<Partial<PluginConfig> | void>((userConfig) => {
  const config: PluginConfig = {...defaultConfig, ...(userConfig || {})}
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
