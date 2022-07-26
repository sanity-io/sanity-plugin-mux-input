import 'media-chrome'

import {Card, Stack, Text} from '@sanity/ui'
import Hls from 'hls.js'
import ProgressBar from 'part:@sanity/components/progress/bar'
import React, {Component} from 'react'
import styled from 'styled-components'

import {getAsset} from '../actions/assets'
import {fetchSecrets} from '../actions/secrets'
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
interface State {
  isLoading: boolean | string
  secrets: Secrets | null
  storyboardUrl: string | null
  posterUrl: string | null
  source: string | null
  error: Hls.errorData | null
  isDeletedOnMux: boolean
  isPreparingStaticRenditions: boolean
}

class MuxVideo extends Component<Props, State> {
  videoContainer = React.createRef<HTMLDivElement>()
  playRef = React.createRef<HTMLDivElement>()
  muteRef = React.createRef<HTMLDivElement>()
  video = React.createRef<HTMLVideoElement>()
  hls: Hls | null = null

  state: State = {
    storyboardUrl: null,
    posterUrl: null,
    source: null,
    isLoading: true,
    error: null,
    isDeletedOnMux: false,
    isPreparingStaticRenditions: false,
    secrets: null,
  }

  // eslint-disable-next-line complexity
  static getDerivedStateFromProps(nextProps: Props) {
    let isLoading: boolean | string = true
    let isPreparingStaticRenditions = false
    const {asset} = nextProps

    if (asset && asset.status === 'preparing') {
      isLoading = 'Preparing the video'
    }
    if (asset && asset.status === 'waiting_for_upload') {
      isLoading = 'Waiting for upload to start'
    }
    if (asset && asset.status === 'waiting') {
      isLoading = 'Processing upload'
    }
    if (asset && asset.status === 'ready') {
      isLoading = false
    }
    if (asset && typeof asset.status === 'undefined') {
      isLoading = false
    }
    if (asset?.data?.static_renditions?.status === 'preparing') {
      isPreparingStaticRenditions = true
    }
    if (asset?.data?.static_renditions?.status === 'ready') {
      isPreparingStaticRenditions = false
    }
    return {
      isLoading,
      isPreparingStaticRenditions,
    }
  }

  componentDidMount() {
    const style = document.createElement('style')
    style.innerHTML = 'button svg { vertical-align: middle; }'

    if (this.playRef.current?.shadowRoot) {
      this.playRef.current.shadowRoot.appendChild(style)
    }
    if (this.muteRef?.current?.shadowRoot) {
      this.muteRef.current.shadowRoot.appendChild(style.cloneNode(true))
    }

    this.setState(MuxVideo.getDerivedStateFromProps(this.props))
    fetchSecrets().then(({secrets}) => this.setState({secrets}))
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    const previousVideo = prevProps.asset.playbackId
    const newVideo = this.props.asset.playbackId

    if (
      !this.state.isLoading &&
      this.state.secrets &&
      (this.state.source === null || previousVideo !== newVideo)!
    ) {
      this.resolveSourceAndPoster(this.props.asset)
    }

    if (this.state.source !== null && this.video.current && !this.video.current.src) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({error: null})
      this.attachVideo()
    }

    if (this.state.source !== null && this.state.source !== prevState.source) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({error: null})
      if (this.hls) {
        this.hls.destroy()
      }
      this.attachVideo()
    }
  }

  resolveSourceAndPoster(asset: VideoAssetDocument) {
    if (asset.assetId === undefined) {
      return
    }

    const options = {asset, secrets: this.state.secrets!}

    const source = getVideoSrc(options)
    const posterUrl = getPosterSrc(options)
    const storyboardUrl = getStoryboardSrc(options)
    this.setState({source, posterUrl, storyboardUrl})
  }

  getVideoElement() {
    return this.video && this.video.current
  }

  attachVideo() {
    const {asset} = this.props

    if (Hls.isSupported()) {
      this.hls = new Hls({autoStartLoad: true})
      this.hls.loadSource(this.state.source!)
      this.hls.attachMedia(this.video.current!)
      this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (this.videoContainer.current) {
          this.videoContainer.current.style.display = 'block'
        }
        this.props.handleVideoReadyToPlay()
      })
      this.hls.on(Hls.Events.ERROR, (event, data) => {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            if (this.videoContainer.current) {
              this.videoContainer.current.style.display = 'none'
            }
            this.setState({error: data})
            getAsset(asset.assetId!)
              .then(() => {
                this.setState({isDeletedOnMux: false})
              })
              .catch((err) => {
                if (err.message.match(/404/)) {
                  this.setState({isDeletedOnMux: true})
                  return
                }
                console.error(data, err) // eslint-disable-line no-console
              })
            break
          default:
            console.error(data) // eslint-disable-line no-console
        }
      })
    } else if (this.video.current!.canPlayType('application/vnd.apple.mpegurl')) {
      this.video.current!.src = this.state.source!
      this.video.current!.addEventListener('loadedmetadata', () => {
        this.hls!.loadSource(this.state.source!)
        this.hls!.attachMedia(this.video.current!)
      })
    }
  }

  getCurrentTime = () => this.video.current?.currentTime ?? 0

  // eslint-disable-next-line complexity
  render() {
    const {posterUrl, isLoading, error} = this.state
    const {asset} = this.props
    if (!asset || !asset.status) {
      return null
    }

    if (isLoading) {
      return (
        <UploadProgressCard>
          <UploadProgressStack>
            <ProgressBar
              percent={100}
              text={(isLoading !== true && isLoading) || 'Waiting for Mux to complete the file'}
              isInProgress
              showPercent
              animation
              color="primary"
            />

            <UploadCancelButton onClick={this.props.handleRemoveVideo}>Cancel</UploadCancelButton>
          </UploadProgressStack>
        </UploadProgressCard>
      )
    }

    const shouldRenderButtons =
      this.props.asset && this.props.asset.status === 'ready' && !this.props.readOnly

    return (
      <>
        <VideoContainer ref={this.videoContainer}>
          <media-controller>
            <video
              ref={this.video}
              poster={posterUrl ?? undefined}
              slot="media"
              crossOrigin="anonomous"
            >
              {this.state.storyboardUrl && (
                <track label="thumbnails" default kind="metadata" src={this.state.storyboardUrl} />
              )}
            </video>
            <media-control-bar>
              <media-play-button ref={this.playRef} />
              <media-mute-button ref={this.muteRef} />
              {/* The media volume range is causing an error to be logged in the studio: Failed to construct 'CustomElement': The result must not have attributes */}
              {/* <media-volume-range /> */}
              <media-time-range />
            </media-control-bar>
          </media-controller>
          {error && (
            <Card padding={3} radius={2} shadow={1} tone="critical" marginTop={2}>
              <Stack space={2}>
                <Text size={1}>There was an error loading this video ({error.type}).</Text>
                {this.state.isDeletedOnMux && <Text size={1}>The video is deleted on Mux</Text>}
              </Stack>
            </Card>
          )}

          {this.state.isPreparingStaticRenditions && (
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
            asset={this.props.asset}
            getCurrentTime={this.getCurrentTime}
            onUpload={this.props.onUpload}
            onBrowse={this.props.onBrowse}
            onRemove={this.props.onRemove}
            videoReadyToPlay={this.props.videoReadyToPlay}
            secrets={this.props.secrets}
          />
        )}
      </>
    )
  }
}

export default MuxVideo
