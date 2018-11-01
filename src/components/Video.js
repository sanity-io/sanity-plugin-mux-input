import React, {Component} from 'react'
import PropTypes from 'prop-types'
import Hls from 'hls.js'
import {getAsset} from '../actions/assets'
import Spinner from 'part:@sanity/components/loading/spinner'

import styles from './Video.css'

const propTypes = {
  assetDocument: PropTypes.object.isRequired
}

class MuxVideo extends Component {
  state = {
    posterUrl: null,
    source: null,
    isLoading: true,
    error: null,
    isDeletedOnMux: false
  }

  videoContainer = React.createRef()
  posterContainer = React.createRef()

  static getDerivedStateFromProps(nextProps) {
    let source = null
    let posterUrl = null
    let isLoading = true
    const {assetDocument} = nextProps
    if (assetDocument && assetDocument.status === 'preparing') {
      isLoading = 'MUX is processing the video'
    }
    if (assetDocument && assetDocument.status === 'ready') {
      isLoading = false
    }
    if (assetDocument && assetDocument.playbackId) {
      source = `https://stream.mux.com/${assetDocument.playbackId}.m3u8`
      posterUrl = `https://image.mux.com/${
        assetDocument.playbackId
      }/thumbnail.png?width=1080&smart_crop=true&time=1`
    }
    return {isLoading, source, posterUrl}
  }

  componentDidMount() {
    this.video = React.createRef()
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.source !== null && this.video.current && !this.video.current.src) {
      this.attachVideo()
    }
  }

  attachVideo() {
    const {assetDocument} = this.props
    if (Hls.isSupported()) {
      const hls = new Hls()
      hls.loadSource(this.state.source)
      hls.attachMedia(this.video.current)
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        this.videoContainer.current.style.display = 'block'
      })
      hls.on(Hls.Events.ERROR, (event, data) => {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            this.videoContainer.current.style.display = 'none'
            this.setState({error: data})
            getAsset(assetDocument.assetId)
              .then(response => {
                this.setState({isDeletedOnMux: false})
              })
              .catch(err => {
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

  render() {
    const {posterUrl, isLoading, error} = this.state
    if (isLoading) {
      return (
        <div className={styles.isLoadingContainer}>
          <div>
            <Spinner inline />
            <span className={styles.isLoadingContent}>{isLoading}</span>
          </div>
        </div>
      )
    }
    return (
      <div>
        <div ref={this.videoContainer} className={styles.videoContainer}>
          <video
            onError={this.handleVideoError}
            className={styles.root}
            controls
            ref={this.video}
            poster={posterUrl}
          />
        </div>
        {error && (
          <div className={[styles.videoContainer, styles.videoError].join(' ')}>
            <p>
              There was an error loading this video ({error.type}
              ).
            </p>
            {this.state.isDeletedOnMux && (
              <p>
                <strong>The video is deleted on MUX.com</strong>
              </p>
            )}
          </div>
        )}
      </div>
    )
  }
}

MuxVideo.propTypes = propTypes

export default MuxVideo
