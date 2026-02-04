import {ErrorOutlineIcon} from '@sanity/icons'
import {Box, Card, CardTone, Spinner, Stack, Text} from '@sanity/ui'
import {useMemo, useRef, useState} from 'react'
import {styled} from 'styled-components'

import {useClient} from '../hooks/useClient'
import {useInView} from '../hooks/useInView'
import {THUMBNAIL_ASPECT_RATIO} from '../util/constants'
import {getAnimatedPosterSrc} from '../util/getAnimatedPosterSrc'
import {getPosterSrc} from '../util/getPosterSrc'
import {AssetThumbnailOptions, MuxAnimatedThumbnailUrl, MuxThumbnailUrl} from '../util/types'

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
  width,
  staticImage = false,
}: {
  asset: AssetThumbnailOptions['asset']
  width?: number
  staticImage?: boolean
}) {
  const ref = useRef<HTMLDivElement | null>(null)
  const inView = useInView(ref)
  const posterWidth = width || 250

  const [status, setStatus] = useState<ImageStatus>('loading')
  const client = useClient()

  const src = useMemo(() => {
    try {
      let thumbnail: MuxAnimatedThumbnailUrl | MuxThumbnailUrl
      if (staticImage) thumbnail = getPosterSrc({asset, client, width: posterWidth})
      else thumbnail = getAnimatedPosterSrc({asset, client, width: posterWidth})

      return thumbnail
    } catch (error) {
      // Re-throw if it's a Promise (Suspense mechanism) - don't catch it!
      if (error && typeof error === 'object' && 'then' in error && typeof error.then === 'function') {
        throw error
      }
      // Handle actual errors
      if (status !== 'error') setStatus('error')
      return undefined
    }
  }, [asset, client, posterWidth, status, staticImage])

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
        maxWidth: width ? `${width}px` : undefined,
        width: '100%',
        flex: 1,
      }}
      border
      radius={2}
      ref={ref}
      tone={STATUS_TO_TONE[status]}
    >
      {inView ? (
        <>
          {status === 'loading' && (
            <Box
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            >
              <Spinner />
            </Box>
          )}
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
            src={src}
            alt={`Preview for ${staticImage ? 'image' : 'video'} ${asset.filename || asset.assetId}`}
            onLoad={handleLoad}
            onError={handleError}
            style={{opacity: status === 'loaded' ? 1 : 0}}
          />
        </>
      ) : null}
    </Card>
  )
}
