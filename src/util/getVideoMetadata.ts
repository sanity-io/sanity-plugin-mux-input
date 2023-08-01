import formatSeconds from './formatSeconds'
import {VideoAssetDocument} from './types'

export default function getVideoMetadata(doc: VideoAssetDocument, useIdAsFallbackTitle = true) {
  const id = doc.assetId || doc._id || ''
  const date = doc.data?.created_at
    ? new Date(Number(doc.data.created_at) * 1000)
    : new Date(doc._createdAt || doc._updatedAt || Date.now())

  const formattedDate = date.toISOString().split('T')[0]

  return {
    title:
      doc.filename || (useIdAsFallbackTitle ? `${id.slice(0, 5)} (${formattedDate})` : undefined),
    createdAt: date,
    duration: doc.data?.duration ? formatSeconds(doc.data?.duration) : undefined,
    aspect_ratio: doc.data?.aspect_ratio,
    max_stored_resolution: doc.data?.max_stored_resolution,
    max_stored_frame_rate: doc.data?.max_stored_frame_rate,
  }
}
