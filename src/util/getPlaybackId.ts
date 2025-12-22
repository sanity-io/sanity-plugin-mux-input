import type {VideoAssetDocument} from './types'

/* - If set, returns asset.playbackId. 
   - Otherwise, checks the array of playback ids, returning the first in the following priority
      public > signed > drm > unknown
   */
export function getPlaybackId(asset: Pick<VideoAssetDocument, 'playbackId' | 'data'>): string {
  try {
    if (!asset) {
      throw new TypeError('Tried to get playback Id with no asset')
    }
    if (asset.playbackId) {
      return asset.playbackId
    }
    if (asset.data?.playback_ids && asset.data?.playback_ids.length > 0) {
      const playbackIdEntry =
        asset.data.playback_ids.find((entry) => entry.policy === 'public') ??
        asset.data.playback_ids.find((entry) => entry.policy === 'signed') ??
        asset.data.playback_ids.find((entry) => entry.policy === 'drm') ??
        asset.data.playback_ids[0]
      return playbackIdEntry.id
    }
    throw new TypeError(`Missing playbackId`)
  } catch (e) {
    console.error('Asset is missing a playbackId', {asset}, e)
    throw e
  }
}
