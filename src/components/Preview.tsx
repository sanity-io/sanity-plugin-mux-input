import React from 'react'
import {SanityDefaultPreview} from 'sanity'

import {useAssetDocumentValues} from '../hooks/useAssetDocumentValues'
import {VideoThumbnail} from './VideoSource.styled'

export interface MuxVideoPreviewProps {
  value: {
    asset: {
      _type: 'reference'
      _ref: string
    }
  }
}
const MuxVideoPreview = ({value}: MuxVideoPreviewProps) => {
  const assetDocumentValues = useAssetDocumentValues(value?.asset!)

  if (assetDocumentValues.value) {
    return <VideoThumbnail asset={assetDocumentValues.value} width={640} />
  }

  // @ts-expect-error
  const {filename, playbackId, status} = value ?? {}

  return (
    <SanityDefaultPreview
      title={filename || playbackId || ''}
      subtitle={status ? `status: ${status}` : null}
    />
  )
}

export default MuxVideoPreview
