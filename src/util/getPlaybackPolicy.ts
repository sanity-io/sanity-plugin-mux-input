import type {PlaybackPolicy, VideoAssetDocument} from './types'

export function getPlaybackPolicy(asset: Pick<VideoAssetDocument, 'data'>): PlaybackPolicy {
  return asset.data?.playback_ids?.[0]?.policy ?? 'public'
}
