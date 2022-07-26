import type {PlaybackPolicy, VideoAssetDocument} from './types'

export function getPlaybackPolicy(asset: VideoAssetDocument): PlaybackPolicy {
  return asset.data?.playback_ids?.[0]?.policy ?? 'public'
}
