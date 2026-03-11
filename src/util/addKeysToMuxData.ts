import {uuid} from '@sanity/uuid'

import type {MuxAsset} from './types'

/**
 * Adds _key to array items in MuxAsset data for Sanity compatibility.
 * Sanity requires _key on array items for proper editing support.
 */
export function addKeysToMuxData(data: MuxAsset): MuxAsset {
  return {
    ...data,
    tracks: data.tracks?.map((track) => ({
      ...track,
      _key: uuid(),
    })),
    playback_ids: data.playback_ids?.map((playbackId) => ({
      ...playbackId,
      _key: uuid(),
    })),
    static_renditions: data.static_renditions
      ? {
          ...data.static_renditions,
          files: data.static_renditions.files?.map((file) => ({
            ...file,
            _key: uuid(),
          })),
        }
      : undefined,
  }
}
