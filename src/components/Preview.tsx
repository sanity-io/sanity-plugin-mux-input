import React, {useMemo} from 'react'
import {SanityDefaultPreview} from 'sanity/_unstable'

import type {MuxAsset, VideoAssetDocument} from '../util/types'
import {VideoThumbnail} from './VideoSource.styles'

export interface MuxVideoPreviewProps {
  value: {
    playbackId?: VideoAssetDocument['playbackId']
    status?: VideoAssetDocument['status']
    thumbTime?: VideoAssetDocument['thumbTime']
    filename?: VideoAssetDocument['filename']
    duration?: MuxAsset['duration']
    playbackIds?: MuxAsset['playback_ids']
  }
}
const MuxVideoPreview = ({value = {}}: MuxVideoPreviewProps) => {
  const asset = useMemo(() => {
    if (!value || value.status !== 'ready' || !value.playbackId || !value.playbackIds) return null

    return {
      playbackId: value.playbackId,
      status: value.status,
      thumbTime: value.thumbTime,
      filename: value.filename,
      duration: value.duration,
      data: {playback_ids: value.playbackIds},
    }
  }, [value])
  if (asset) {
    return <VideoThumbnail asset={asset} width={640} />
  }

  const {filename, playbackId, status} = value ?? {}

  return (
    <SanityDefaultPreview
      title={filename || playbackId || ''}
      subtitle={status ? `status: ${status}` : null}
    />
  )
}

export default MuxVideoPreview
