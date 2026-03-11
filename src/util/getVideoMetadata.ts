import {formatSeconds} from './formatSeconds'
import type {MuxTextTrack, VideoAssetDocument} from './types'

export default function getVideoMetadata(doc: VideoAssetDocument) {
  const id = doc.assetId || doc._id || ''
  const date = doc.data?.created_at
    ? new Date(Number(doc.data.created_at) * 1000)
    : new Date(doc._createdAt || doc._updatedAt || Date.now())

  return {
    title: doc.filename || id.slice(0, 12),
    id: id,
    playbackId: doc.playbackId,
    createdAt: date,
    duration: doc.data?.duration ? formatSeconds(doc.data?.duration) : undefined,
    playback_ids: doc.data?.playback_ids,
    aspect_ratio: doc.data?.aspect_ratio,
    max_stored_resolution: doc.data?.max_stored_resolution,
    max_stored_frame_rate: doc.data?.max_stored_frame_rate,
    text_tracks:
      doc.data?.tracks?.filter((track): track is MuxTextTrack => track.type === 'text') || [],
  }
}
