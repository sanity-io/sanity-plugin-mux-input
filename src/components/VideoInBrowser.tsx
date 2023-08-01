import {CheckmarkIcon, EditIcon} from '@sanity/icons'
import {Button, Card, Stack} from '@sanity/ui'
import React from 'react'

import {VideoAssetDocument} from '../util/types'
import VideoMetadata from './VideoMetadata'
import VideoThumbnail from './VideoThumbnail'

export default function VideoInBrowser({
  onSelect,
  onEdit,
  asset,
}: {
  onSelect?: (asset: VideoAssetDocument) => void
  onEdit?: (asset: VideoAssetDocument) => void
  asset: VideoAssetDocument
}) {
  const select = React.useCallback(() => onSelect?.(asset), [onSelect, asset])
  const edit = React.useCallback(() => onEdit?.(asset), [onEdit, asset])

  if (!asset) {
    return null
  }

  return (
    <Card border padding={2} sizing="border" radius={2}>
      <Stack
        space={3}
        height="fill"
        style={{
          gridTemplateRows: 'min-content min-content 1fr',
        }}
      >
        <VideoThumbnail asset={asset} />
        <VideoMetadata asset={asset} />
        <div
          style={{
            display: 'flex',
            width: '100%',
            alignItems: 'flex-end',
            justifyContent: 'flex-start',
            gap: '.35rem',
          }}
        >
          {onSelect && (
            <Button
              icon={CheckmarkIcon}
              fontSize={2}
              padding={2}
              mode="ghost"
              text="Select"
              style={{flex: 1}}
              tone="positive"
              onClick={select}
            />
          )}
          <Button
            icon={EditIcon}
            fontSize={2}
            padding={2}
            mode="ghost"
            text="Details"
            style={{flex: 1}}
            onClick={edit}
          />
        </div>
      </Stack>
    </Card>
  )
}
