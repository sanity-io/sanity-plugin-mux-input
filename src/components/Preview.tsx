import React, {Suspense, useEffect, useMemo, useState} from 'react'
import {useSource} from 'sanity'
import type {SanityDefaultPreviewProps} from 'sanity/_unstable'
import {SanityDefaultPreview} from 'sanity/_unstable'

import {getPosterSrc} from '../util/getPosterSrc'
// @ts-ignore -- fix TS typings for CSS modules
import styles from './Preview.module.css'

function fetchSecrets(client?: any) {
  // console.log('Preview', client)
  return Promise.resolve({} as any)
}

export interface Props {
  // @TODO: fix up the any types
  value?: SanityDefaultPreviewProps['value'] &
    Partial<{
      status: any
      playbackIds: any
      thumbTime: any
      filename: any
      playbackId: any
    }>
}
const MuxVideoPreview = (props: Props) => {
  const {client} = useSource()
  const [secrets, setSecrets] = useState(undefined)

  useEffect(() => {
    fetchSecrets(client).then((data) => setSecrets(data.secrets))
  }, [client])

  const {filename, playbackId, status} = props.value || {}
  const fallbackValue = useMemo(
    () => ({
      title: filename || playbackId || '',
      subtitle: status ? `status: ${status}` : null,
    }),
    [filename, playbackId, status]
  )

  if (!props.value) return null

  if (props.value && secrets && props.value.status === 'ready') {
    const {signingKeyId, signingKeyPrivate} = secrets
    return (
      <Suspense fallback={null}>
        <Image
          playbackId={props.value.playbackIds[0]}
          signingKeyId={signingKeyId}
          signingKeyPrivate={signingKeyPrivate}
          value={props.value}
        />
      </Suspense>
    )
  }

  return <SanityDefaultPreview value={fallbackValue} />
}

export interface ImageProps {
  playbackId: any
  signingKeyId: any
  signingKeyPrivate: any
  value: any
}
function Image(props: ImageProps) {
  const {playbackId, value, signingKeyId, signingKeyPrivate} = props

  const posterSrc = getPosterSrc(playbackId.id, {
    time: value.thumbTime,
    fit_mode: 'crop',
    width: 640,
    height: 360,
    isSigned: playbackId.policy === 'signed',
    signingKeyId,
    signingKeyPrivate,
  })

  return <div className={styles.poster} style={{backgroundImage: `url(${posterSrc})`}} />
}

export default MuxVideoPreview
