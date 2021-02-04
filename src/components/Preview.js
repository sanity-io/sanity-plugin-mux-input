import React from 'react'
import PropTypes from 'prop-types'
import {SanityDefaultPreview} from 'part:@sanity/base/preview'

import getPosterSrc from '../util/getPosterSrc'
import {fetchSecrets} from '../actions/secrets'
import styles from './Preview.css'

const MuxVideoPreview = (props) => {
  const [secrets, setSecrets] = React.useState(undefined)
  const [posterSrc, setPosterSrc] = React.useState(undefined)

  React.useEffect(() => {
    fetchSecrets().then((data) => setSecrets(data.secrets))
  }, [])

  React.useEffect(() => {
    if (props.value === null || secrets === undefined) return

    if (props.value.status !== 'ready') return

    const {signingKeyId, signingKeyPrivate} = secrets
    const playbackId = props.value.playback_ids[0]

    setPosterSrc(
      getPosterSrc(playbackId.id, {
        time: props.value.thumbTime,
        fitMode: 'crop',
        width: 640,
        height: 360,
        isSigned: playbackId.policy === 'signed',
        signingKeyId,
        signingKeyPrivate,
      })
    )
  }, [props.value, secrets])

  if (!props.value) return null

  if (posterSrc !== undefined) {
    return <div className={styles.poster} style={{backgroundImage: `url(${posterSrc})`}} />
  }

  const {filename, playbackId, status} = props.value

  return (
    <SanityDefaultPreview
      title={filename || playbackId || ''}
      subtitle={status ? `status: ${status}` : null}
    />
  )
}

MuxVideoPreview.propTypes = {
  value: PropTypes.object,
}

export default MuxVideoPreview
