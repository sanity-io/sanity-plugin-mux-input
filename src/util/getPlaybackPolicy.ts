import type {MuxPlaybackId, PlaybackPolicy, VideoAssetDocument} from './types'

export function getPlaybackPolicy(
  asset: Pick<VideoAssetDocument, 'data' | 'playbackId'>
): PlaybackPolicy {
  return (
    asset.data?.playback_ids?.find((playbackId) => asset.playbackId === playbackId.id)?.policy ??
    'public'
  )
}

export function getPlaybackPolicyById(
  asset: Pick<VideoAssetDocument, 'data'>,
  playbackId: string
): MuxPlaybackId | undefined {
  return asset.data?.playback_ids?.find((entry) => playbackId === entry.id)
}
