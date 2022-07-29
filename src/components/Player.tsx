import {type PlaybackEngine, generatePlayerInitTime, initialize} from '@mux-elements/playback-core'
import {Card, Stack, Text} from '@sanity/ui'
import {
  MediaControlBar,
  MediaController,
  MediaDurationDisplay,
  MediaFullscreenButton,
  MediaLoadingIndicator,
  MediaMuteButton,
  MediaPlayButton,
  MediaTimeDisplay,
  MediaTimeRange,
} from 'media-chrome/dist/react'
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {useClient} from 'sanity'

import {useCancelUpload} from '../hooks/useCancelUpload'
import type {DialogState, SetDialogState} from '../hooks/useDialogState'
import {getVideoSrc} from '../util/getVideoSrc'
import type {MuxInputProps, VideoAssetDocument} from '../util/types'
import EditThumbnailDialog from './EditThumbnailDialog'
import {
  PosterImage,
  StyledCenterControls,
  ThumbnailsMetadataTrack,
  TopControls,
  VideoContainer,
} from './Player.styled'
import {UploadProgress} from './UploadProgress'

interface Props extends Pick<MuxInputProps, 'onChange' | 'readOnly'> {
  buttons?: React.ReactNode
  asset: VideoAssetDocument
  dialogState: DialogState
  setDialogState: SetDialogState
}

const MuxVideo = ({asset, buttons, readOnly, onChange, dialogState, setDialogState}: Props) => {
  const client = useClient()
  const isLoading = useMemo<boolean | string>(() => {
    if (asset?.status === 'preparing') {
      return 'Preparing the video'
    }
    if (asset?.status === 'waiting_for_upload') {
      return 'Waiting for upload to start'
    }
    if (asset?.status === 'waiting') {
      return 'Processing upload'
    }
    if (asset?.status === 'ready') {
      return false
    }
    if (typeof asset?.status === 'undefined') {
      return false
    }

    return true
  }, [asset])
  const isPreparingStaticRenditions = useMemo<boolean>(() => {
    if (asset?.data?.static_renditions?.status === 'preparing') {
      return true
    }
    if (asset?.data?.static_renditions?.status === 'ready') {
      return false
    }
    return false
  }, [asset?.data?.static_renditions?.status])
  const videoSrc = useMemo(() => asset.playbackId && getVideoSrc({client, asset}), [asset, client])
  const [error, setError] = useState<MediaError | Error | null>(null)
  const handleError = useCallback<React.ReactEventHandler<HTMLVideoElement>>(
    (event) => setError(event.currentTarget.error),
    []
  )
  const [isDeletedOnMux, setDeletedOnMux] = useState<boolean>(false)
  const playRef = useRef<HTMLDivElement>(null)
  const muteRef = useRef<HTMLDivElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const getCurrentTime = useCallback(() => video.current?.currentTime ?? 0, [video])
  const handleCancelUpload = useCancelUpload(asset, onChange)

  useEffect(() => {
    const style = document.createElement('style')
    style.innerHTML = 'button svg { vertical-align: middle; }'

    if (playRef.current?.shadowRoot) {
      playRef.current.shadowRoot.appendChild(style)
    }
    if (muteRef?.current?.shadowRoot) {
      muteRef.current.shadowRoot.appendChild(style.cloneNode(true))
    }
  }, [])
  const [playerInitTime] = useState(() => generatePlayerInitTime())
  const playbackEngineRef = useRef<PlaybackEngine | undefined>(undefined)

  useEffect(() => {
    if (isLoading || !videoSrc) {
      return
    }
    const nextPlaybackEngineRef = initialize(
      {
        src: videoSrc,
        playerInitTime,
        playerSoftwareName: 'sanity-plugin-mux-input',
        playerSoftwareVersion: 'dev-preview',
      },
      video.current,
      playbackEngineRef.current
    )
    playbackEngineRef.current = nextPlaybackEngineRef
  }, [videoSrc, isLoading, playerInitTime])

  if (!asset || !asset.status) {
    return null
  }

  /*
  if (assetDocument && assetDocument.status === 'errored') {
            // eslint-disable-next-line no-warning-comments
            // todo: use client.observable
            return this.handleRemoveVideo().then(() => {
              this.setState({
                isLoading: false,
                error: new Error(assetDocument.data?.errors?.messages?.join(' ')),
              })
            })
          }
// */

  if (isLoading) {
    return (
      <UploadProgress
        progress={100}
        filename={asset?.filename}
        text={(isLoading !== true && isLoading) || 'Waiting for Mux to complete the file'}
        onCancel={readOnly ? undefined : () => handleCancelUpload().catch(setError)}
      />
    )
  }

  return (
    <>
      <VideoContainer shadow={1} tone="transparent" scheme="dark">
        <MediaController>
          <video
            playsInline
            ref={video}
            onError={handleError}
            slot="media"
            preload="metadata"
            crossOrigin="anonomous"
          >
            <ThumbnailsMetadataTrack asset={asset} />
          </video>
          <PosterImage asset={asset} />
          <MediaLoadingIndicator slot="centered-chrome" noAutoHide />
          <StyledCenterControls slot="centered-chrome">
            <MediaPlayButton />
          </StyledCenterControls>
          {buttons && <TopControls slot="top-chrome">{buttons}</TopControls>}
          <MediaControlBar>
            <MediaMuteButton />
            <MediaTimeDisplay />
            <MediaTimeRange />
            <MediaDurationDisplay />
            <MediaFullscreenButton />
          </MediaControlBar>
        </MediaController>
        {error && (
          <Card padding={3} radius={2} shadow={1} tone="critical" marginTop={2}>
            <Stack space={2}>
              <Text size={1}>There was an error loading this video ({error.type}).</Text>
              {isDeletedOnMux && <Text size={1}>The video is deleted on Mux</Text>}
            </Stack>
          </Card>
        )}

        {isPreparingStaticRenditions && (
          <Card
            padding={2}
            radius={1}
            style={{
              background: 'var(--card-fg-color)',
              position: 'absolute',
              top: '0.5em',
              left: '0.5em',
            }}
          >
            <Text size={1} style={{color: 'var(--card-bg-color)'}}>
              MUX is preparing static renditions, please stand by
            </Text>
          </Card>
        )}
      </VideoContainer>
      {dialogState === 'edit-thumbnail' && (
        <EditThumbnailDialog
          asset={asset}
          getCurrentTime={getCurrentTime}
          setDialogState={setDialogState}
        />
      )}
    </>
  )
}

export default MuxVideo
