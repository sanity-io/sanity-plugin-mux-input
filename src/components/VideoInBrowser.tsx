import {CheckmarkIcon, EditIcon, LockIcon} from '@sanity/icons'
import {Button, Card, Stack, Text, Tooltip} from '@sanity/ui'
import React from 'react'

import {getPlaybackPolicy} from '../util/getPlaybackPolicy'
import {VideoAssetDocument} from '../util/types'
import IconInfo from './IconInfo'
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

  const playbackPolicy = getPlaybackPolicy(asset)

  return (
    <Card
      border
      padding={2}
      sizing="border"
      radius={2}
      style={{
        position: 'relative',
      }}
    >
      {playbackPolicy === 'signed' && (
        <Tooltip
          content={
            <Card padding={2} radius={2}>
              <IconInfo icon={LockIcon} text="Signed playback policy" size={2} />
            </Card>
          }
          placement="right"
          fallbackPlacements={['top', 'bottom']}
          portal
        >
          <Card
            tone="caution"
            style={{
              borderRadius: '100%',
              position: 'absolute',
              left: '1em',
              top: '1em',
              zIndex: 10,
            }}
            padding={2}
            border
          >
            <Text muted size={1}>
              <LockIcon />
            </Text>
          </Card>
        </Tooltip>
      )}
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
