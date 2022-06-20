import {LinearProgress} from 'sanity/_unstable'
import type {SanityClient} from '@sanity/client'
import {Button, Card, Stack, Text} from '@sanity/ui'
import Hls from 'hls.js'
import {
  MediaControlBar,
  MediaController,
  MediaMuteButton,
  MediaPlayButton,
  MediaProgressRange,
  MediaVolumeRange,
} from 'media-chrome/dist/react'
import React, {Component} from 'react'

import {getAsset} from '../actions/assets'
import {type Secrets} from '../types'
import {getPosterSrc} from '../util/getPosterSrc'
import {getStoryboardSrc} from '../util/getStoryboardSrc'
import {getVideoSrc} from '../util/getVideoSrc'
import styles from './Video.module.css'

const NOOP = () => {
  /* intentional noop */
}

export interface Props {
  client: SanityClient
  assetDocument: any
  autoload?: boolean
  secrets?: Secrets
  onCancel?: (event: any) => void
  onReady?: (event?: any) => void
}

class MuxVideo extends Component<Props, any> {
  static defaultProps = {
    autoload: true,
    onCancel: undefined,
    onReady: undefined,
  }

  playRef: any
  muteRef: any
  video: any
  videoContainer = React.createRef<any>()
  hls = null

  constructor(props) {
    super(props)
    this.state = {
      storyboardUrl: null,
      posterUrl: null,
      source: null,
      isLoading: true,
      error: null,
      isDeletedOnMux: false,
      isPreparingStaticRenditions: false,
    }
    this.playRef = React.createRef()
    this.muteRef = React.createRef()
  }

  componentDidMount() {
    this.video = React.createRef()

    const style = document.createElement('style')
    style.innerHTML = 'button svg { vertical-align: middle; }'

    if (this.playRef?.current?.shadowRoot) {
      this.playRef.current.shadowRoot.appendChild(style)
    }
    if (this.muteRef?.current?.shadowRoot) {
      this.muteRef.current.shadowRoot.appendChild(style.cloneNode(true))
    }
  }

  resolveSourceAndPoster = (doc: unknown) => {
    //TODO implement?
  }

  componentDidUpdate(prevProps, prevState) {
    const previousVideo = prevProps.assetDocument.playbackId
    const newVideo = this.props.assetDocument.playbackId

    if (
      !this.state.isLoading &&
      this.props.secrets &&
      (this.state.source === null || previousVideo !== newVideo)
    ) {
      this.resolveSourceAndPoster(this.props.assetDocument)
    }

    if (this.state.source !== null && this.video.current && !this.video.current.src) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({error: null})
      this.attachVideo()
    }

    if (this.state.source !== null && this.state.source !== prevState.source) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({error: null, showControls: false})
      if (this.hls) {
        this.hls.destroy()
      }
      this.attachVideo()
    }
  }

  getVideoElement() {
    return this.video && this.video.current
  }

  attachVideo() {
    const {assetDocument, autoload} = this.props

    if (Hls.isSupported()) {
      this.hls = new Hls({autoStartLoad: autoload})
      this.hls.loadSource(this.state.source)
      this.hls.attachMedia(this.video.current)
      this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (this.videoContainer.current) {
          this.videoContainer.current.style.display = 'block'
        }
        if (this.props.onReady) {
          this.props.onReady()
        }
      })
      this.hls.on(Hls.Events.ERROR, (_, data) => {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            if (this.videoContainer.current) {
              this.videoContainer.current.style.display = 'none'
            }
            this.setState({error: data})
            getAsset(this.props.client, assetDocument.assetId)
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
    } else if (this.video.current.canPlayType('application/vnd.apple.mpegurl')) {
      this.video.current.src = this.state.source
      this.video.current.addEventListener('loadedmetadata', () => {
        this.hls.loadSource(this.state.source)
        this.hls.attachMedia(this.video.current)
      })
    }
  }

  handleVideoClick = (event: any) => {
    this.setState({showControls: true})
    this.hls.startLoad(0)
    if (this.props.onReady) {
      this.props.onReady(event)
    }
  }

  handleCancelButtonClicked = (event: any) => {
    if (this.props.onCancel) {
      this.props.onCancel(event)
    }
  }

  // eslint-disable-next-line complexity
  render() {
    const {posterUrl, isLoading, error} = this.state
    const {assetDocument, autoload} = this.props
    if (!assetDocument || !assetDocument.status) {
      return null
    }

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
          <div className={styles.uploadCancelButton}>
            <Button onClick={this.handleCancelButtonClicked}>Cancel</Button>
          </div>
        </div>
      )
    }

    const showControls = autoload || this.state.showControls

    return (
      <div ref={this.videoContainer} className={styles.videoContainer}>
        <MediaController>
          <video
            onClick={autoload ? NOOP : this.handleVideoClick}
            ref={this.video}
            poster={posterUrl}
            slot="media"
            crossOrigin="anonomous"
          >
            {this.state.storyboardUrl && (
              <track label="thumbnails" default kind="metadata" src={this.state.storyboardUrl} />
            )}
          </video>

          {showControls && (
            <MediaControlBar>
              <MediaPlayButton ref={this.playRef} />
              <MediaMuteButton ref={this.muteRef} />
              <MediaVolumeRange />
              <MediaProgressRange />
            </MediaControlBar>
          )}
        </MediaController>
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
      </div>
    )
  }
}

export default MuxVideo
