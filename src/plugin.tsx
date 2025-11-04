import React, {Suspense} from 'react'
const Input = React.lazy(() => import('./components/Input'))
import VideoThumbnail from './components/VideoThumbnail'
import type {MuxInputProps, PluginConfig, VideoAssetDocument} from './util/types'

export function muxVideoCustomRendering(config: PluginConfig) {
  return {
    components: {
      input: (props: MuxInputProps) => (
        <Suspense>
          <Input config={{...config, ...props.schemaType.options}} {...props} />
        </Suspense>
      ),
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
