import {ErrorOutlineIcon} from '@sanity/icons'
import {Card, CardTone, Stack, Text} from '@sanity/ui'
import React, {useState} from 'react'
import styled from 'styled-components'

import {useClient} from '../hooks/useClient'
import useInView from '../hooks/useInView'
import {THUMBNAIL_ASPECT_RATIO} from '../util/constants'
import {getAnimatedPosterSrc} from '../util/getAnimatedPosterSrc'
import {VideoAssetDocument} from '../util/types'
import SpinnerBox from './SpinnerBox'

const Image = styled.img`
  transition: opacity 0.175s ease-out 0s;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center center;
`

type ImageStatus = 'loading' | 'error' | 'loaded'

const STATUS_TO_TONE: Record<ImageStatus, CardTone> = {
  loading: 'transparent',
  error: 'critical',
  loaded: 'default',
}

export default function VideoThumbnail({
  asset,
  width = 250,
}: {
  asset: Partial<VideoAssetDocument>
  width?: number
}) {
  const {inView, ref} = useInView()

  const [status, setStatus] = useState<ImageStatus>('loading')
  const client = useClient()

  const animatedSrc = getAnimatedPosterSrc({asset, client, width})

  function handleLoad() {
    setStatus('loaded')
  }

  function handleError() {
    setStatus('error')
  }

  return (
    <Card
      style={{
        aspectRatio: THUMBNAIL_ASPECT_RATIO,
        position: 'relative',
      }}
      border
      radius={2}
      ref={ref as any}
      tone={STATUS_TO_TONE[status]}
    >
      {inView ? (
        <>
          {status === 'loading' && <SpinnerBox />}
          {status === 'error' && (
            <Stack
              space={4}
              style={{
                position: 'absolute',
                width: '100%',
                left: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                justifyItems: 'center',
              }}
            >
              <Text size={4} muted>
                <ErrorOutlineIcon style={{fontSize: '1.75em'}} />
              </Text>
              <Text muted align="center">
                Failed loading thumbnail
              </Text>
            </Stack>
          )}
          <Image
            src={animatedSrc}
            alt={`Preview for video ${asset.filename || asset.assetId}`}
            onLoad={handleLoad}
            onError={handleError}
            style={{
              opacity: status === 'loaded' ? 1 : 0,
            }}
          />
        </>
      ) : null}
    </Card>
  )
}
