import React from 'react'
import PropTypes from 'prop-types'
import {SanityDefaultPreview} from 'part:@sanity/base/preview'

import Video from './Video'
import styles from './Preview.css'
import formatTime from '../util/formatTime'
import getPosterSrc from '../util/getPosterSrc'
import { fetchSecrets } from '../actions/secrets'

export default class MuxVideoPreview extends React.Component {
  static propTypes = {
    value: PropTypes.object
  }

  constructor(props) {
    super(props)

    this.state = { secrets: null, posterSrc: null }
  }

  componentDidMount() {
    fetchSecrets().then(({ secrets }) => this.setState({ secrets }));
  }

  componentDidUpdate(prevProps) {
    if (this.props.value.status !== prevProps.value.status && this.props.value.status === 'ready') {
      const posterSrc = getPosterSrc(this.props.value.playbackId, {
        time: this.props.value.thumbTime,
        fitMode: 'crop',
        width: 60,
        height: 60,
        isSigned: this.props.value.data.playback_ids[0].policy === 'signed',
        signingKeyId: this.state.secrets.signingKeyId,
        signingKeyPrivate: this.state.secrets.signingKeyPrivate
      })
      this.setState({ posterSrc })
    }
  }

  render() {
    const { value, layout } = this.props
    const { posterSrc } = this.state
    if (!value) {
      return null
    }
    if (layout === 'block') {
      return (
        <div className={styles.root}>
          <div className={styles.video}>
            <Video assetDocument={value} autoload={false} />
          </div>
        </div>
      )
    }
    const {playbackId, duration, filename} = value
    const media = posterSrc ? <img src={posterSrc} /> : null
    return (
      <SanityDefaultPreview
        media={media}
        title={filename || playbackId}
        subtitle={duration ? `Duration: ${formatTime(duration)}` : null}
      />
    )
  }
}
