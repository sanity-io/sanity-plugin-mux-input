import React from 'react'
import PropTypes from 'prop-types'
import {SanityDefaultPreview} from 'part:@sanity/base/preview'

import Video from './Video'
import styles from './Preview.css'
import formatTime from '../util/formatTime'
import getPosterSrc from '../util/getPosterSrc'

export default class MuxVideoPreview extends React.Component {
  static propTypes = {
    value: PropTypes.object
  }

  render() {
    const {value, layout} = this.props
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
    const {playbackId, status, duration, filename, thumbTime} = value
    let posterUrl
    if (status === 'ready') {
      posterUrl = getPosterSrc(playbackId, {
        time: thumbTime,
        fitMode: 'crop',
        width: 60,
        height: 60
      })
    }
    const media = posterUrl ? <img src={posterUrl} /> : null
    return (
      <SanityDefaultPreview
        media={media}
        title={filename || playbackId}
        subtitle={duration ? `Duration: ${formatTime(duration)}` : null}
      />
    )
  }
}
