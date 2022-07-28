import 'media-chrome'

import {Card, Stack, Text} from '@sanity/ui'
import Hls, {type ErrorData} from 'hls.js'
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {useClient} from 'sanity'
import styled from 'styled-components'
import usePrevious from 'use-previous'

import {getAsset} from '../actions/assets'
import {getPosterSrc} from '../util/getPosterSrc'
import {getStoryboardSrc} from '../util/getStoryboardSrc'
import {getVideoSrc} from '../util/getVideoSrc'
import type {Secrets, VideoAssetDocument} from '../util/types'
import {type FileInputButtonProps} from './FileInputButton'
import {
  UploadButtonGrid,
  UploadCancelButton,
  UploadProgressCard,
  UploadProgressStack,
} from './Uploader.styles'

const VideoContainer = styled.div`
  position: relative;
  min-height: 150px;
`

declare global {
  namespace JSX {
    interface IntrinsicElements {
      ['media-controller']: JSX.IntrinsicElements['div']
      ['media-control-bar']: JSX.IntrinsicElements['div']
      ['media-play-button']: JSX.IntrinsicElements['div']
      ['media-mute-button']: JSX.IntrinsicElements['div']
      ['media-time-range']: JSX.IntrinsicElements['div']
    }
  }
}

interface Props {
  onUpload: FileInputButtonProps['onSelect']
  asset: VideoAssetDocument
  handleRemoveVideo: () => void
  onBrowse: () => void
  onRemove: () => void
  handleVideoReadyToPlay: () => void
  readOnly: boolean
  videoReadyToPlay: boolean
  secrets: Secrets
}

const MuxVideo = ({
  asset,
  secrets,
  handleVideoReadyToPlay,
  handleRemoveVideo,
  onBrowse,
  onRemove,
  onUpload,
  readOnly,
  videoReadyToPlay,
}: Props) => {
  const client = useClient()
  const hasPlaybackId = !!asset.playbackId
  const options = useMemo(() => ({asset, client, secrets}), [asset, client, secrets])
  const source = useMemo(
    () => (hasPlaybackId ? getVideoSrc(options) : null),
    [hasPlaybackId, options]
  )
  const posterUrl = useMemo(
    () => (hasPlaybackId ? getPosterSrc(options) : null),
    [hasPlaybackId, options]
  )
  const storyboardUrl = useMemo(
    () => (hasPlaybackId ? getStoryboardSrc(options) : null),
    [hasPlaybackId, options]
  )
  const isLoading = useMemo<boolean | string>(() => {
    if (asset && asset.status === 'preparing') {
      return 'Preparing the video'
    }
    if (asset && asset.status === 'waiting_for_upload') {
      return 'Waiting for upload to start'
    }
    if (asset && asset.status === 'waiting') {
      return 'Processing upload'
    }
    if (asset && asset.status === 'ready') {
      return false
    }
    if (asset && typeof asset.status === 'undefined') {
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
  const [error, setError] = useState<ErrorData | null>(null)
  const [isDeletedOnMux, setDeletedOnMux] = useState<boolean>(false)
  const videoContainer = useRef<HTMLDivElement>(null)
  const playRef = useRef<HTMLDivElement>(null)
  const muteRef = useRef<HTMLDivElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const hls = useRef<Hls | null>(null)
  const getCurrentTime = useCallback(() => video.current?.currentTime ?? 0, [video])

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

  const attachVideo = useCallback(() => {
    if (Hls.isSupported()) {
      hls.current = new Hls({autoStartLoad: true})
      hls.current.loadSource(source!)
      hls.current.attachMedia(video.current!)
      hls.current.on(Hls.Events.MANIFEST_PARSED, () => {
        if (videoContainer.current) {
          videoContainer.current.style.display = 'block'
        }
        handleVideoReadyToPlay()
      })
      hls.current.on(Hls.Events.ERROR, (event, data) => {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            if (videoContainer.current) {
              videoContainer.current.style.display = 'none'
            }
            setError(data)
            getAsset(client, asset.assetId!)
              .then(() => {
                setDeletedOnMux(false)
              })
              .catch((err) => {
                if (err.message.match(/404/)) {
                  setDeletedOnMux(true)
                  return
                }
                console.error(data, err) // eslint-disable-line no-console
              })
            break
          default:
            console.error(data) // eslint-disable-line no-console
        }
      })
    } else if (video.current!.canPlayType('application/vnd.apple.mpegurl')) {
      video.current!.src = source!
      video.current!.addEventListener('loadedmetadata', () => {
        hls.current!.loadSource(source!)
        hls.current!.attachMedia(video.current!)
      })
    }
  }, [asset.assetId, client, handleVideoReadyToPlay, source])
  const prevSource = usePrevious(source)
  // eslint-disable-next-line consistent-return
  useEffect(() => {
    if (source !== null && video.current && !video.current.src) {
      setError(null)
      attachVideo()
      return () => {
        if (hls.current) {
          hls.current.destroy()
          hls.current = null
        }
      }
    }

    if (source !== null && source !== prevSource) {
      setError(null)
      attachVideo()
      return () => {
        if (hls.current) {
          hls.current.destroy()
          hls.current = null
        }
      }
    }
  }, [attachVideo, prevSource, source])

  if (!asset || !asset.status) {
    return null
  }

  if (isLoading) {
    return (
      <UploadProgressCard>
        <UploadProgressStack>
          {/* <ProgressBar
            percent={100}
            text={(isLoading !== true && isLoading) || 'Waiting for Mux to complete the file'}
            isInProgress
            showPercent
            animation
            color="primary"
          /> */}

          <UploadCancelButton onClick={handleRemoveVideo}>Cancel</UploadCancelButton>
        </UploadProgressStack>
      </UploadProgressCard>
    )
  }

  const shouldRenderButtons = asset && asset.status === 'ready' && !readOnly

  return (
    <>
      <VideoContainer ref={videoContainer}>
        <media-controller>
          <video ref={video} poster={posterUrl ?? undefined} slot="media" crossOrigin="anonomous">
            {storyboardUrl && (
              <track label="thumbnails" default kind="metadata" src={storyboardUrl} />
            )}
          </video>
          <media-control-bar>
            <media-play-button ref={playRef} />
            <media-mute-button ref={muteRef} />
            {/* The media volume range is causing an error to be logged in the studio: Failed to construct 'CustomElement': The result must not have attributes */}
            {/* <media-volume-range /> */}
            <media-time-range />
          </media-control-bar>
        </media-controller>
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
      {shouldRenderButtons && (
        <UploadButtonGrid
          asset={asset}
          getCurrentTime={getCurrentTime}
          onUpload={onUpload}
          onBrowse={onBrowse}
          onRemove={onRemove}
          videoReadyToPlay={videoReadyToPlay}
          secrets={secrets}
        />
      )}
    </>
  )
}

export default MuxVideo
