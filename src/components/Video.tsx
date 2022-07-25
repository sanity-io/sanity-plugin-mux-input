import {Card, Stack, Text} from '@sanity/ui'
import Hls from 'hls.js'
import 'media-chrome'
import Button from 'part:@sanity/components/buttons/default'
import ProgressBar from 'part:@sanity/components/progress/bar'
import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {getAsset} from '../actions/assets'
import {fetchSecrets} from '../actions/secrets'
import getPosterSrc from '../util/getPosterSrc'
import getStoryboardSrc from '../util/getStoryboardSrc'
import getVideoSrc from '../util/getVideoSrc'
import styles from './Video.css'

const NOOP = () => {
  /* intentional noop */
}

const propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  assetDocument: PropTypes.object.isRequired,
  autoload: PropTypes.bool,
  onCancel: PropTypes.func,
  onReady: PropTypes.func,
}

class MuxVideo extends Component {
  videoContainer = React.createRef()
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
      secrets: null,
    }
    this.playRef = React.createRef()
    this.muteRef = React.createRef()
  }

  // eslint-disable-next-line complexity
  static getDerivedStateFromProps(nextProps) {
    let isLoading = true
    let isPreparingStaticRenditions = false
    const {assetDocument} = nextProps

    if (assetDocument && assetDocument.status === 'preparing') {
      isLoading = 'Preparing the video'
    }
    if (assetDocument && assetDocument.status === 'waiting_for_upload') {
      isLoading = 'Waiting for upload to start'
    }
    if (assetDocument && assetDocument.status === 'waiting') {
      isLoading = 'Processing upload'
    }
    if (assetDocument && assetDocument.status === 'ready') {
      isLoading = false
    }
    if (assetDocument && typeof assetDocument.status === 'undefined') {
      isLoading = false
    }
    if (assetDocument?.data?.static_renditions?.status === 'preparing') {
      isPreparingStaticRenditions = true
    }
    if (assetDocument?.data?.static_renditions?.status === 'ready') {
      isPreparingStaticRenditions = false
    }
    return {
      isLoading,
      isPreparingStaticRenditions,
    }
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

    this.setState(MuxVideo.getDerivedStateFromProps(this.props))
    fetchSecrets().then(({secrets}) => this.setState({secrets}))
  }

  componentDidUpdate(prevProps, prevState) {
    const previousVideo = prevProps.assetDocument.playbackId
    const newVideo = this.props.assetDocument.playbackId

    if (
      !this.state.isLoading &&
      this.state.secrets &&
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

  resolveSourceAndPoster(assetDocument) {
    const playbackId = assetDocument.playbackId
    const options = {
      isSigned: assetDocument.data.playback_ids[0].policy === 'signed',
      signingKeyId: this.state.secrets.signingKeyId || null,
      signingKeyPrivate: this.state.secrets.signingKeyPrivate || null,
    }

    const source = getVideoSrc(playbackId, options)
    const posterUrl = getPosterSrc(playbackId, options)
    const storyboardUrl = getStoryboardSrc(playbackId, options)
    this.setState({source, posterUrl, storyboardUrl})
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
      this.hls.on(Hls.Events.MANIFEST_PARSED, (e) => {
        if (this.videoContainer.current) {
          this.videoContainer.current.style.display = 'block'
        }
        if (this.props.onReady) {
          this.props.onReady()
        }
      })
      this.hls.on(Hls.Events.ERROR, (event, data) => {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            if (this.videoContainer.current) {
              this.videoContainer.current.style.display = 'none'
            }
            this.setState({error: data})
            getAsset(assetDocument.assetId)
              .then((response) => {
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

  handleVideoClick = (event) => {
    this.setState({showControls: true})
    this.hls.startLoad(0)
    if (this.props.onReady) {
      this.props.onReady(event)
    }
  }

  handleCancelButtonClicked = (event) => {
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
            <ProgressBar
              percent={100}
              text={(isLoading !== true && isLoading) || 'Waiting for Mux to complete the file'}
              isInProgress
              showPercent
              animation
              color="primary"
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
        <media-controller>
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
            <media-control-bar>
              <media-play-button ref={this.playRef} />
              <media-mute-button ref={this.muteRef} />
              {/* The media volume range is causing an error to be logged in the studio: Failed to construct 'CustomElement': The result must not have attributes */}
              {/* <media-volume-range /> */}
              <media-progress-range />
            </media-control-bar>
          )}
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
      </div>
    )
  }
}

MuxVideo.propTypes = propTypes

MuxVideo.defaultProps = {
  autoload: true,
  onCancel: undefined,
  onReady: undefined,
}

export default MuxVideo
