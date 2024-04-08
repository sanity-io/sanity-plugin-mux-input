import Input from './components/Input'
import VideoThumbnail from './components/VideoThumbnail'
import type {MuxInputProps, PluginConfig, VideoAssetDocument} from './util/types'

export function muxVideoCustomRendering(config: PluginConfig) {
  return {
    components: {
      input: (props: MuxInputProps) => (
        <Input config={{...config, ...props.schemaType.options}} {...props} />
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
