import type {VideoAssetDocument} from './types'

/* - Returns the playback id of the asset based on the specified priority.
  By default chooses the "strongest" policy
   - Otherwise, returns the first playback id in the array.
   */
export function getPlaybackId(
  asset: Pick<VideoAssetDocument, 'data'>,
  priority: string[] = ['drm', 'signed', 'public']
): string {
  try {
    if (!asset) {
      throw new TypeError('Tried to get playback Id with no asset')
    }

    const playbackIds = asset.data?.playback_ids
    if (playbackIds && playbackIds.length > 0) {
      for (const policy of priority) {
        const match = playbackIds.find((entry) => entry.policy === policy)
        if (match) {
          return match.id
        }
      }

      return playbackIds[0].id
    }

    throw new TypeError('Missing playbackId')
  } catch (e) {
    console.error('Asset is missing a playbackId', {asset}, e)
    throw e
  }
}
