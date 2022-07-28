import React, {useEffect, useMemo} from 'react'
import {useClient} from 'sanity'
import {SanityDefaultPreview} from 'sanity/_unstable'

import {fetchSecrets} from '../actions/secrets'
import type {MuxAsset, Secrets, VideoAssetDocument} from '../util/types'
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
  const client = useClient()
  const [secrets, setSecrets] = React.useState<Secrets | null>(null)

  useEffect(
    () => void fetchSecrets(client).then(({secrets: _secrets}) => setSecrets(_secrets!)),
    [client]
  )

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
  if (asset && secrets) {
    return <VideoThumbnail asset={asset} secrets={secrets} width={640} />
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
