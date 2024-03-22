import type {VideoAssetDocument} from './types'

export function getPlaybackId(asset: Pick<VideoAssetDocument, 'playbackId'>): string {
  if (!asset?.playbackId) {
    console.error('Asset is missing a playbackId', {asset})
    throw new TypeError(`Missing playbackId`)
  }
  return asset.playbackId
}
