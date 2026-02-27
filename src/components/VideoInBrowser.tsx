import {CheckmarkIcon, EditIcon, LockIcon, PlayIcon} from '@sanity/icons'
import {Button, Card, Stack, Text, Tooltip} from '@sanity/ui'
import React, {useState} from 'react'
import {styled} from 'styled-components'

import {DRMWarningDialog, useDrmPlaybackWarningContext} from '../context/DrmPlaybackWarningContext'
import {THUMBNAIL_ASPECT_RATIO} from '../util/constants'
import {getPlaybackPolicy} from '../util/getPlaybackPolicy'
import {VideoAssetDocument} from '../util/types'
import IconInfo from './IconInfo'
import {AudioIcon} from './icons/Audio'
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

type RenderState = 'render-video' | 'pre-render-warn' | false

export default function VideoInBrowser({
  onSelect,
  onEdit,
  asset,
}: {
  onSelect?: (asset: VideoAssetDocument) => void
  onEdit?: (asset: VideoAssetDocument) => void
  asset: VideoAssetDocument
}) {
  const [renderVideo, setRenderVideo] = useState<RenderState>(false)
  const select = React.useCallback(() => onSelect?.(asset), [onSelect, asset])
  const edit = React.useCallback(() => onEdit?.(asset), [onEdit, asset])
  const {hasShownWarning} = useDrmPlaybackWarningContext()

  if (!asset) {
    return null
  }

  const playbackPolicy = getPlaybackPolicy(asset)
  const onClickPlay = () => {
    if (playbackPolicy?.policy === 'drm' && !hasShownWarning) {
      setRenderVideo('pre-render-warn')
    } else {
      setRenderVideo('render-video')
    }
  }
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
      {playbackPolicy?.policy === 'signed' && (
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
              zIndex: 11,
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
      {playbackPolicy?.policy === 'drm' && (
        <Tooltip
          animate
          content={
            <Card padding={2} radius={2}>
              <IconInfo icon={LockIcon} text="DRM playback policy" size={2} />
            </Card>
          }
          placement="right"
          fallbackPlacements={['top', 'bottom']}
          portal
        >
          <Card
            tone="caution"
            style={{
              borderRadius: '0.25rem',
              position: 'absolute',
              left: '1em',
              top: '1em',
              zIndex: 11,
            }}
            padding={2}
            border
          >
            <Text muted size={1} weight="semibold" style={{color: 'var(--card-icon-color)'}}>
              DRM
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
        {renderVideo === 'pre-render-warn' && (
          <DRMWarningDialog
            onClose={() => {
              setRenderVideo('render-video')
            }}
          />
        )}
        {renderVideo === 'render-video' ? (
          <VideoPlayer asset={asset} autoPlay forceAspectRatio={THUMBNAIL_ASPECT_RATIO} />
        ) : (
          <PlayButton onClick={onClickPlay}>
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
                <AudioIcon width="3em" height="3em" />
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
