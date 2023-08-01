import type {PlaybackPolicy, VideoAssetDocument} from './types'

export function getPlaybackPolicy(asset: Partial<VideoAssetDocument>): PlaybackPolicy {
  return asset.data?.playback_ids?.[0]?.policy ?? 'public'
}
