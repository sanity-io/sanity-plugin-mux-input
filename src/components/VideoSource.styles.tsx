import {MediaPreview} from '@sanity/base/components'
import {LockIcon, UnknownIcon} from '@sanity/icons'
import {Box, Card, Grid, Inline} from '@sanity/ui'
import React, {Suspense, useMemo} from 'react'
import styled from 'styled-components'
import {suspend} from 'suspend-react'
import {useErrorBoundary} from 'use-error-boundary'

import {getPlaybackPolicy} from '../util/getPlaybackPolicy'
import getPosterSrc from '../util/getPosterSrc'
import {isSigned} from '../util/isSigned'
import type {Secrets, VideoAssetDocument} from '../util/types'

const mediaDimensions = {aspect: 16 / 9}

interface ImageLoaderProps {
  alt: string
  src: string
  height: number
  width: number
}
const ImageLoader = ({alt, src, height, width}: ImageLoaderProps) => {
  suspend(async () => {
    const img = new Image(width, height)
    img.decoding = 'async'
    img.src = src
    await img.decode()
  }, ['sanity-plugin-mux-input', 'image', src])

  return <img alt={alt} src={src} height={height} width={width} />
}

const VideoMediaPreview = styled(MediaPreview)`
  img {
    object-fit: cover;
  }
`

interface VideoMediaPreviewSignedSubtitleProps {
  solo?: boolean
}
const VideoMediaPreviewSignedSubtitle = ({solo}: VideoMediaPreviewSignedSubtitleProps) => {
  return (
    <Inline
      space={1}
      style={{marginTop: solo ? '-1.35em' : undefined, marginBottom: solo ? undefined : '0.35rem'}}
    >
      <LockIcon />
      Signed playback policy
    </Inline>
  )
}

interface PosterImageProps extends Omit<ImageLoaderProps, 'src' | 'alt'> {
  asset: VideoAssetDocument
  secrets: Secrets
}
const PosterImage = ({asset, height, width, secrets}: PosterImageProps) => {
  const src = getPosterSrc({asset, secrets, height, width, fit_mode: 'smartcrop'})
  const subtitle = useMemo(
    () => (isSigned(asset, secrets) ? <VideoMediaPreviewSignedSubtitle solo /> : undefined),
    [asset, secrets]
  )

  // eslint-disable-next-line no-warning-comments
  // @TODO support setting the alt text in the schema, like how we deal with images
  return (
    <VideoMediaPreview
      mediaDimensions={mediaDimensions}
      subtitle={subtitle}
      title={<>{null}</>}
      media={<ImageLoader alt="" src={src} height={height} width={width} />}
    />
  )
}

interface VideoThumbnailProps extends Omit<PosterImageProps, 'height'> {
  asset: VideoAssetDocument
  width: number
}
export const VideoThumbnail = ({asset, secrets, width}: VideoThumbnailProps) => {
  const {ErrorBoundary, didCatch, error} = useErrorBoundary()
  const height = Math.round((width * 9) / 16)
  const subtitle = useMemo(
    () => (getPlaybackPolicy(asset) === 'signed' ? <VideoMediaPreviewSignedSubtitle /> : undefined),
    [asset]
  )

  if (didCatch) {
    return (
      <VideoMediaPreview
        subtitle={error.message}
        mediaDimensions={mediaDimensions}
        title="Error when loading thumbnail"
        media={
          <Card radius={2} height="fill" style={{position: 'relative', width: '100%'}}>
            <Box
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            >
              <UnknownIcon />
            </Box>
          </Card>
        }
      />
    )
  }

  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <VideoMediaPreview
            isPlaceholder
            title="Loading thumbnail..."
            subtitle={subtitle}
            mediaDimensions={mediaDimensions}
          />
        }
      >
        <PosterImage asset={asset} secrets={secrets} height={height} width={width} />
      </Suspense>
    </ErrorBoundary>
  )
}

export const ThumbGrid = styled(Grid)`
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
`

export const CardLoadMore = styled(Card)`
  border-top: 1px solid var(--card-border-color);
  position: sticky;
  bottom: 0;
  z-index: 200;
`
