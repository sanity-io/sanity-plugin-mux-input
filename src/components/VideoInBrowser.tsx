import {CheckmarkIcon, EditIcon, LockIcon, PlayIcon} from '@sanity/icons'
import {Button, Card, Stack, Text, Tooltip} from '@sanity/ui'
import React, {useState} from 'react'
import {styled} from 'styled-components'

import {THUMBNAIL_ASPECT_RATIO} from '../util/constants'
import {getPlaybackPolicy} from '../util/getPlaybackPolicy'
import {VideoAssetDocument} from '../util/types'
import IconInfo from './IconInfo'
import VideoMetadata from './VideoMetadata'
import VideoPlayer, {assetIsAudio} from './VideoPlayer'
import VideoThumbnail from './VideoThumbnail'

const PlayButton = styled.button`
  display: block;
  padding: 0;
  margin: 0;
  border: none;
  border-radius: 0.1875rem;
  position: relative;
  cursor: pointer;

  &::after {
    content: '';
    background: var(--card-fg-color);
    opacity: 0;
    display: block;
    position: absolute;
    inset: 0;
    z-index: 10;
    transition: 0.15s ease-out;
    border-radius: inherit;
  }

  > div[data-play] {
    z-index: 11;
    opacity: 0;
    transition: 0.15s 0.05s ease-out;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    color: var(--card-fg-color);
    background: var(--card-bg-color);
    width: auto;
    height: 30%;
    aspect-ratio: 1;
    border-radius: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    box-sizing: border-box;
    > svg {
      display: block;
      width: 70%;
      height: auto;
      // Visual balance to center-align the icon
      transform: translateX(5%);
    }
  }

  &:hover,
  &:focus {
    &::after {
      opacity: 0.3;
    }
    > div[data-play] {
      opacity: 1;
    }
  }
`

export default function VideoInBrowser({
  onSelect,
  onEdit,
  asset,
}: {
  onSelect?: (asset: VideoAssetDocument) => void
  onEdit?: (asset: VideoAssetDocument) => void
  asset: VideoAssetDocument
}) {
  const [renderVideo, setRenderVideo] = useState(false)
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
          animate
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
        {renderVideo ? (
          <VideoPlayer asset={asset} autoPlay forceAspectRatio={THUMBNAIL_ASPECT_RATIO} />
        ) : (
          <PlayButton onClick={() => setRenderVideo(true)}>
            <div data-play>
              <PlayIcon />
            </div>
            {assetIsAudio(asset) ? (
              <div
                style={{
                  aspectRatio: THUMBNAIL_ASPECT_RATIO,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="3em" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    style={{opacity: '0.65'}}
                    d="M10.75 19q.95 0 1.6-.65t.65-1.6V13h3v-2h-4v3.875q-.275-.2-.587-.288t-.663-.087q-.95 0-1.6.65t-.65 1.6t.65 1.6t1.6.65M6 22q-.825 0-1.412-.587T4 20V4q0-.825.588-1.412T6 2h8l6 6v12q0 .825-.587 1.413T18 22zm7-13V4H6v16h12V9zM6 4v5zv16z"
                  />
                </svg>
              </div>
            ) : (
              <VideoThumbnail asset={asset} />
            )}
          </PlayButton>
        )}
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
