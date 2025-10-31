import {definePlugin} from 'sanity'

import createStudioTool, {DEFAULT_TOOL_CONFIG} from '../components/StudioTool'
import {muxVideoCustomRendering} from '../plugin'
import {muxVideoSchema, schemaTypes} from '../schema'
import type {PluginConfig} from '../util/types'
export type {VideoAssetDocument} from '../util/types'

export const defaultConfig: PluginConfig = {
  mp4_support: 'none',
  video_quality: 'plus',
  max_resolution_tier: '1080p',
  normalize_audio: false,
  defaultSigned: false,
  tool: DEFAULT_TOOL_CONFIG,
  allowedRolesForConfiguration: [],
}

export const muxInput = definePlugin<Partial<PluginConfig> | void>((userConfig) => {
  // TODO: Remove this on next major version when we end support for encoding_tier
  if (typeof userConfig === 'object' && 'encoding_tier' in userConfig) {
    const deprecated_encoding_tier = userConfig.encoding_tier
    if (!userConfig.video_quality) {
      if (deprecated_encoding_tier === 'baseline') {
        userConfig.video_quality = 'basic'
      }
      if (deprecated_encoding_tier === 'smart') {
        userConfig.video_quality = 'plus'
      }
    }
  }
  const config: PluginConfig = {...defaultConfig, ...(userConfig || {})}
  return {
    name: 'mux-input',
    schema: {
      types: [
        ...schemaTypes,
        {
          ...muxVideoSchema,
          ...muxVideoCustomRendering(config),
        },
      ],
    },
    tools: config.tool === false ? undefined : [createStudioTool(config)],
  }
})
