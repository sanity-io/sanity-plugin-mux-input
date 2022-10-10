import {LockIcon, UnknownIcon} from '@sanity/icons'
import {Box, Card, Grid, Inline, Spinner} from '@sanity/ui'
import React, {memo, Suspense, useMemo} from 'react'
import {MediaPreview} from 'sanity'
import styled from 'styled-components'
import {suspend} from 'suspend-react'
import {useErrorBoundary} from 'use-error-boundary'

import {useClient} from '../hooks/useClient'
import {getAnimatedPosterSrc} from '../util/getAnimatedPosterSrc'
import {getPlaybackPolicy} from '../util/getPlaybackPolicy'
import {getPosterSrc} from '../util/getPosterSrc'
import type {VideoAssetDocument} from '../util/types'

const mediaDimensions = {aspect: 16 / 9}

interface ImageLoaderProps {
  alt: string
  src: string
  height?: number
  width: number
  aspectRatio?: string
}
const ImageLoader = memo(function ImageLoader({
  alt,
  src,
  height,
  width,
  aspectRatio,
}: ImageLoaderProps) {
  suspend(async () => {
    const img = new Image(width, height)
    img.decoding = 'async'
    img.src = src
    await img.decode()
  }, ['sanity-plugin-mux-input', 'image', src])

  return <img alt={alt} src={src} height={height} width={width} style={{aspectRatio}} />
})

// @TODO fix typings errors due to props.renderDefault
const VideoMediaPreview = styled<any>(MediaPreview)`
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
      style={{
        marginTop: solo ? '-1.35em' : undefined,
        marginBottom: solo ? undefined : '0.35rem',
      }}
    >
      <LockIcon />
      Signed playback policy
    </Inline>
  )
}

interface PosterImageProps extends Omit<ImageLoaderProps, 'src' | 'alt'> {
  asset: VideoAssetDocument
  showTip?: boolean
}
const PosterImage = ({asset, height, width, showTip}: PosterImageProps) => {
  const client = useClient()
  const src = getPosterSrc({
    asset,
    client,
    height,
    width,
    fit_mode: 'smartcrop',
  })
  const subtitle = useMemo(
    () =>
      showTip && getPlaybackPolicy(asset) === 'signed' ? (
        <VideoMediaPreviewSignedSubtitle solo />
      ) : undefined,
    [asset, showTip]
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

export interface VideoThumbnailProps extends Omit<PosterImageProps, 'height'> {
  width: number
}
export const VideoThumbnail = memo(function VideoThumbnail({
  asset,
  width,
  showTip,
}: VideoThumbnailProps) {
  const {ErrorBoundary, didCatch, error} = useErrorBoundary()
  const height = Math.round((width * 9) / 16)
  const subtitle = useMemo(
    () =>
      showTip && getPlaybackPolicy(asset) === 'signed' ? (
        <VideoMediaPreviewSignedSubtitle />
      ) : undefined,
    [showTip, asset]
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
        <PosterImage showTip={showTip} asset={asset} height={height} width={width} />
      </Suspense>
    </ErrorBoundary>
  )
})

// @TODO fix typings errors due to props.renderDefault
const AnimatedVideoMediaPreview = styled<any>(MediaPreview)`
  img {
    object-fit: contain;
  }
`

interface AnimatedPosterImageProps extends Omit<ImageLoaderProps, 'src' | 'alt' | 'height'> {
  asset: VideoAssetDocument
}
const AnimatedPosterImage = ({asset, width}: AnimatedPosterImageProps) => {
  const client = useClient()
  const src = getAnimatedPosterSrc({asset, client, width})

  // eslint-disable-next-line no-warning-comments
  // @TODO support setting the alt text in the schema, like how we deal with images
  return (
    <AnimatedVideoMediaPreview
      withBorder={false}
      mediaDimensions={mediaDimensions}
      media={<ImageLoader alt="" src={src} width={width} aspectRatio="16:9" />}
    />
  )
}

export interface AnimatedVideoThumbnailProps extends Omit<PosterImageProps, 'height'> {
  width: number
}
export const AnimatedVideoThumbnail = memo(function AnimatedVideoThumbnail({
  asset,
  width,
}: AnimatedVideoThumbnailProps) {
  const {ErrorBoundary, didCatch} = useErrorBoundary()

  if (didCatch) {
    return null
  }

  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <FancyBackdrop>
            <VideoMediaPreview
              mediaDimensions={mediaDimensions}
              withBorder={false}
              media={<Spinner muted />}
            />
          </FancyBackdrop>
        }
      >
        <Card height="fill" tone="transparent">
          <AnimatedPosterImage asset={asset} width={width} />
        </Card>
      </Suspense>
    </ErrorBoundary>
  )
})
const FancyBackdrop = styled(Box)`
  backdrop-filter: blur(8px) brightness(0.5) saturate(2);
  mix-blend-mode: color-dodge;
`

export const ThumbGrid = styled(Grid)`
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
`

export const CardLoadMore = styled(Card)`
  border-top: 1px solid var(--card-border-color);
  position: sticky;
  bottom: 0;
  z-index: 200;
`
