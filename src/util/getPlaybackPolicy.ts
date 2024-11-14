import type {PlaybackPolicy, VideoAssetDocument} from './types'

export function getPlaybackPolicy(
  asset: Pick<VideoAssetDocument, 'data' | 'playbackId'>
): PlaybackPolicy {
  return (
    asset.data?.playback_ids?.find((playbackId) => asset.playbackId === playbackId.id)?.policy ??
    'public'
  )
}
