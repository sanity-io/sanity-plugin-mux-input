import React from 'react'

import Input from './components/Input'
import {VideoThumbnail} from './components/VideoSource.styled'
import type {Config, MuxInputProps, VideoAssetDocument} from './util/types'

export function muxVideoCustomRendering(config: Config) {
  return {
    components: {
      input: (props: MuxInputProps) => <Input config={config} {...props} />,
    },
    preview: {
      select: {
        filename: 'asset.filename',
        playbackId: 'asset.playbackId',
        status: 'asset.status',
        assetId: 'asset.assetId',
        thumbTime: 'asset.thumbTime',
        data: 'asset.data',
      },
      prepare: (asset: Partial<VideoAssetDocument>) => {
        const {filename, playbackId, status} = asset
        return {
          title: filename || playbackId || '',
          subtitle: status ? `status: ${status}` : null,
          media: asset.playbackId ? <VideoThumbnail asset={asset} width={64} /> : null,
        }
      },
    },
  }
}
