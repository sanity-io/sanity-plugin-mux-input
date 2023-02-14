import MuxVideo from '@mux/mux-video-react'
import {Card, Text} from '@sanity/ui'
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

import {useCancelUpload} from '../hooks/useCancelUpload'
import {useClient} from '../hooks/useClient'
import type {DialogState, SetDialogState} from '../hooks/useDialogState'
import {getVideoSrc} from '../util/getVideoSrc'
import type {MuxInputProps, VideoAssetDocument} from '../util/types'
import pluginPkg from './../../package.json'
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

const MuxVideoOld = ({asset, buttons, readOnly, onChange, dialogState, setDialogState}: Props) => {
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

  useEffect(() => {
    if (asset?.status === 'errored') {
      handleCancelUpload()
      // eslint-disable-next-line no-warning-comments
      // @TODO use better error handling
      throw new Error(asset.data?.errors?.messages?.join(' '))
    }
  }, [asset.data?.errors?.messages, asset?.status, handleCancelUpload])

  const signedToken = useMemo(() => {
    try {
      const url = new URL(videoSrc!)
      return url.searchParams.get('token')
    } catch {
      return false
    }
  }, [videoSrc])

  if (error) {
    // @TODO better error handling
    throw error
  }

  if (!asset || !asset.status) {
    return null
  }

  if (isLoading) {
    return (
      <UploadProgress
        progress={100}
        filename={asset?.filename}
        text={(isLoading !== true && isLoading) || 'Waiting for Mux to complete the file'}
        onCancel={readOnly ? undefined : () => handleCancelUpload()}
      />
    )
  }

  return (
    <>
      <VideoContainer shadow={1} tone="transparent" scheme="dark">
        <MediaController>
          <MuxVideo
            playsInline
            ref={video}
            playbackId={`${asset.playbackId}${signedToken ? `?token=${signedToken}` : ''}`}
            onError={handleError}
            slot="media"
            preload="metadata"
            crossOrigin="anonymous"
            metadata={{
              player_name: 'Sanity Admin Dashboard',
              player_version: pluginPkg.version,
              page_type: 'Preview Player',
            }}
          >
            <ThumbnailsMetadataTrack asset={asset} />
          </MuxVideo>
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

export default MuxVideoOld
