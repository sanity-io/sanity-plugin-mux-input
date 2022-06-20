import {type PlaybackEngine, generatePlayerInitTime, initialize} from '@mux-elements/playback-core'
import {PlugIcon, SearchIcon, UploadIcon} from '@sanity/icons'
import {rem} from '@sanity/ui'
import {Button, Card, Flex, Grid, Heading, Inline, Stack, Text} from '@sanity/ui'
// How to customize these https://www.media-chrome.org/
import {
  MediaControlBar,
  MediaController,
  MediaDurationDisplay,
  MediaFullscreenButton,
  MediaLoadingIndicator,
  MediaMuteButton,
  MediaPlayButton,
  MediaPosterImage,
  MediaTimeDisplay,
  MediaTimeRange,
} from 'media-chrome/dist/react'
import React, {memo, useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {useSource} from 'sanity'
import {LinearProgress} from 'sanity/_unstable'
import styled from 'styled-components'

//FIXME importing from package.json puts bundle types in the wrong spot, since the file is outside src
//import {name as playerSoftwareName, version as playerSoftwareVersion} from '../../package.json'
import {type DialogState, type SetDialogState} from '../hooks/useDialogState'
import {useObservedAsset} from '../hooks/useObservedAsset'
import {
  type ThumbnailProps,
  useStoryboardVtt,
  useThumbnailPng,
  useVideoSrc,
} from '../hooks/usePlaybackUrls'
import {useIsSecretsConfigured, useSecrets} from '../hooks/useSecrets'
import {type VideoAssetDocument, type VideoInputProps} from '../types'
import EditThumbnailDialog from './EditThumbnailDialog'
// @ts-ignore -- fix TS typings for CSS modules
import styles from './Video.module.css'

export type DebugProps = VideoInputProps

const StyledCenterControls = styled.div`
  && {
    --media-background-color: transparent;
    --media-button-icon-width: 100%;
    --media-button-icon-height: auto;
    pointer-events: none;
    width: 100%;
    display: flex;
    flex-flow: row;
    align-items: center;
    justify-content: center;

    media-play-button {
      --media-control-background: transparent;
      --media-control-hover-background: transparent;
      padding: 0;
      width: max(27px, min(9%, 90px));
    }
  }
`
const VideoContainer = styled(Card)`
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: 1px;

  media-airplay-button[media-airplay-unavailable] {
    display: none;
  }

  media-volume-range[media-volume-unavailable] {
    display: none;
  }

  media-pip-button[media-pip-unavailable] {
    display: none;
  }

  media-controller {
    --media-control-background: transparent;
    --media-control-hover-background: transparent;
    --media-range-track-background-color: rgba(255, 255, 255, 0.5);
    --media-range-track-border-radius: 3px;
    width: 100%;
    height: 100%;
    background-color: transparent;
  }

  media-control-bar {
    --media-button-icon-width: 18px;
  }

  media-control-bar:not([slot]) :is([role='button'], [role='switch'], button) {
    height: 44px;
  }

  .size-extra-small media-control-bar [role='button'],
  .size-extra-small media-control-bar [role='switch'] {
    height: auto;
    padding: 4.4% 3.2%;
  }

  .mxp-spacer {
    flex-grow: 1;
    height: 100%;
    background-color: var(--media-control-background, rgba(20, 20, 30, 0.7));
  }

  media-controller::part(vertical-layer) {
    transition: background-color 1s;
  }

  media-controller:is([media-paused], :not([user-inactive]))::part(vertical-layer) {
    background-color: rgba(0, 0, 0, 0.6);
    transition: background-color 0.25s;
  }

  .mxp-center-controls {
    --media-background-color: transparent;
    --media-button-icon-width: 100%;
    --media-button-icon-height: auto;
    pointer-events: none;
    width: 100%;
    display: flex;
    flex-flow: row;
    align-items: center;
    justify-content: center;
  }

  .mxp-center-controls media-play-button {
    --media-control-background: transparent;
    --media-control-hover-background: transparent;
    padding: 0;
    width: max(27px, min(9%, 90px));
  }

  .mxp-center-controls media-seek-backward-button,
  .mxp-center-controls media-seek-forward-button {
    --media-control-background: transparent;
    --media-control-hover-background: transparent;
    padding: 0;
    margin: 0 10%;
    width: min(7%, 70px);
  }

  media-loading-indicator {
    --media-loading-icon-width: 100%;
    --media-button-icon-height: auto;
    pointer-events: none;
    position: absolute;
    width: min(15%, 150px);
    display: flex;
    flex-flow: row;
    align-items: center;
    justify-content: center;
  }

  /* Intentionally don't target the div for transition but the children
 of the div. Prevents messing with media-chrome's autohide feature. */
  media-loading-indicator + div * {
    transition: opacity 0.15s;
    opacity: 1;
  }

  media-loading-indicator[media-loading]:not([media-paused]) ~ div > * {
    opacity: 0;
    transition-delay: 400ms;
  }

  media-volume-range {
    width: min(100%, 100px);
  }

  media-time-display {
    white-space: nowrap;
  }

  :is(media-time-display, media-text-display, media-playback-rate-button) {
    color: inherit;
  }

  media-controller:fullscreen media-control-bar[slot='top-chrome'] {
    /* Hide menus and buttons that trigger modals when in full-screen */
    display: none;
  }

  video {
    background: transparent;
  }

  media-controller:not(:fullscreen) video {
    aspect-ratio: 16 / 9;
  }
  media-controller:not(:-webkit-full-screen) video {
    aspect-ratio: 16 / 9;
  }
`

const TopControls = styled(MediaControlBar)`
  justify-content: flex-end;

  button {
    height: auto;
  }
`

export interface Props {
  asset: VideoAssetDocument
  setDialogState: SetDialogState
  dialogState: DialogState
  buttons: React.ReactNode
}
function Video(props: Props) {
  const {asset, buttons, dialogState, setDialogState} = props
  const {client} = useSource()
  const secrets = useSecrets()
  const videoContainer = useRef<HTMLDivElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const autoload = true
  const getCurrentTime = useCallback(() => {
    return video.current?.currentTime ?? 0
  }, [])
  const handleReady = useCallback(() => {
    /*
    https://github.com/sanity-io/sanity-plugin-mux-input/blob/main/src/components/Input.js
const handleVideoReadyToPlay = useCallback(() => {
    setVideoReadyToPlay(true)
  }, [])
   // */
    // console.log('ready')
  }, [])
  const handleCancel = useCallback(() => {
    // this.handleRemoveVideo
    // https://github.com/sanity-io/sanity-plugin-mux-input/blob/476874f7c67348b29c508fadb651f52bd5f48042/src/components/Input.js#L285-L331
    // console.log('cancel')
  }, [])

  const videoSrc = useVideoSrc(asset)

  const isLoading = useMemo(() => {
    // TODO: type these
    // Can use https://github.com/muxinc/mux-node-sdk/blob/master/src/video/domain.ts
    switch (asset.status) {
      case 'preparing':
        return 'Preparing the video'
      case 'waiting_for_upload':
        return 'Waiting for upload to start'
      case 'waiting':
        return 'Processing upload'
      case 'ready':
      case undefined:
        return false
      default:
        return true
    }
  }, [asset.status])
  const isPreparingStaticRenditions = useMemo(() => {
    if (asset.data?.static_renditions?.status) {
      return asset.data.static_renditions.status === 'preparing'
    }

    return false
  }, [asset.data?.static_renditions])

  const [playerInitTime] = useState(() => generatePlayerInitTime())
  const playbackEngineRef = useRef<PlaybackEngine | undefined>(undefined)
  const showControls = autoload //|| this.state.showControls
  const error = null
  const isDeletedOnMux = false

  const playbackId = asset.playbackId

  useEffect(() => {
    if (isLoading) {
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
  }, [videoSrc, isLoading])

  // console.log({videoSrc, playbackId})
  // console.debug({client, secrets, handleReady})
  if (isLoading) {
    return (
      <div>
        <div className={styles.progressBar}>
          <LinearProgress
            value={100}
            // text={(isLoading !== true && isLoading) || 'Waiting for Mux to complete the file'}
            // isInProgress
            // showPercent
            // animation
            // color="primary"
          />
        </div>
        {(isLoading !== true && isLoading) || 'Waiting for Mux to complete the file'}
        {videoSrc}
        <div className={styles.uploadCancelButton}>
          <Button onClick={handleCancel} text="Cancel" />
        </div>
      </div>
    )
  }

  return (
    <>
      <VideoContainer
        shadow={1}
        tone="transparent"
        ref={videoContainer}
        className={styles.videoContainer}
      >
        <MediaController>
          <video
            playsInline
            ref={video}
            onError={(e) => console.error('onError', e)}
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
          <TopControls slot="top-chrome">{buttons}</TopControls>
          {showControls && (
            <MediaControlBar>
              <MediaMuteButton />
              <MediaTimeDisplay />
              <MediaTimeRange />
              <MediaDurationDisplay />
              <MediaFullscreenButton />
            </MediaControlBar>
          )}
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
          getCurrentTime={getCurrentTime}
          setDialogState={setDialogState}
          asset={asset}
        />
      )}
    </>
  )
}

export interface PosterImageProps {
  asset: VideoAssetDocument
}
function PosterImage({asset}: PosterImageProps) {
  // Why useState instead of useMemo? Because we really really only want to run it exactly once and useMemo doesn't make that guarantee
  // The `fit_mode pad` stuff is to workaround a flaw in the poster aspect-ratio that stretches the image to fit
  // I tried adding object-fit: contain to the `media-poster-image img` element but for the life of me I can't pierce the shadow dom D':
  const [props] = useState<ThumbnailProps>(() => ({
    time: asset.thumbTime,
    width: 1920,
    height: 1080,
    fit_mode: 'pad',
  }))
  const posterUrl = useThumbnailPng(asset, props)

  return <MediaPosterImage slot="poster" src={posterUrl} />
}

export interface ThumbnailsMetadataTrackProps {
  asset: VideoAssetDocument
}
function ThumbnailsMetadataTrack({asset}: ThumbnailsMetadataTrackProps) {
  const storyboardUrl = useStoryboardVtt(asset)

  return <track label="thumbnails" default kind="metadata" src={storyboardUrl} />
}

export default memo(Video)
