import {LockIcon} from '@sanity/icons'
import {Card, Flex, Inline, Layer, Skeleton, Spinner, useTheme} from '@sanity/ui'
import React, {Suspense, useCallback, useLayoutEffect, useRef, useState} from 'react'
import {MediaPreview} from 'sanity/_unstable'
import styled from 'styled-components'
import {suspend} from 'suspend-react'
import {getDevicePixelRatio} from 'use-device-pixel-ratio'
import {useErrorBoundary} from 'use-error-boundary'

import {useAnimatedGif, useIsSigned, useThumbnailPng} from '../../hooks/usePlaybackUrls'
import {useSecrets} from '../../hooks/useSecrets'
import {type VideoAssetDocument} from '../../types'
import AssetActionsMenu from './AssetActionsMenu'

const MediaSkeleton = styled(Skeleton).attrs({animated: true, radius: 2})`
  width: 100%;
  height: 100%;
`

const Image = styled.img`
  position: absolute;
  z-index: 1;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: block;
  background: black;
`

const ThumbnailImage = styled(Image)`
  object-fit: cover;
`

interface StaticPosterProps {
  asset: VideoAssetDocument
}
function StaticPoster(props: StaticPosterProps) {
  const {asset} = props
  const secrets = useSecrets()
  const width = 200 * getDevicePixelRatio({maxDpr: 2})
  const src = useThumbnailPng(asset, {
    width,
    height: Math.round((width * 9) / 16),
    fit_mode: 'smartcrop',
  })
  // console.log(secrets, suspend, src)

  return (
    <ThumbnailImage
      alt=""
      data-src={
        'https://images.unsplash.com/photo-1651135094094-7f2a48224da8?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=987&q=80'
      }
      src={src}
    />
  )
}

const AnimatedImage = styled(Image)`
  transition: all 600ms;
  opacity: 0;
  border-radius: 0.1875rem;
  z-index: 2;
  filter: blur(8px);
  object-fit: contain;
`

interface AnimatedPosterProps {
  asset: VideoAssetDocument
}
function AnimatedPoster(props: AnimatedPosterProps) {
  const {asset} = props
  const secrets = useSecrets()
  const width = 200 * getDevicePixelRatio({maxDpr: 2})
  const src = useAnimatedGif(asset, {width, fps: 15})
  // console.log(secrets, suspend, src)
  const ref = useRef()
  const [animate, shouldAnimate] = useState(false)

  useLayoutEffect(() => {
    if ((ref.current as any)?.animate) {
      if (!animate) {
        shouldAnimate(true)
        return
      }
      // @ts-expect-error
      ref.current.animate(
        [
          {filter: 'blur(8px)', opacity: 0},
          {filter: 'blur(0px)', opacity: 1},
        ],
        {
          duration: 600,
        }
      )
    }
  }, [animate])

  return (
    <AnimatedImage
      ref={ref}
      alt=""
      data-src={
        'https://images.unsplash.com/photo-1651135094094-7f2a48224da8?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=987&q=80'
      }
      src={src}
    />
  )
}

const FullscreenLayer = styled(Layer)`
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  backdrop-filter: blur(8px);
  pointer-events: none;
`

function FullscreenSpinner() {
  const {color} = useTheme().sanity
  const ref = useRef()
  const [animate, shouldAnimate] = useState(false)

  useLayoutEffect(() => {
    if ((ref.current as any)?.animate) {
      if (!animate) {
        shouldAnimate(true)
        return
      }
      // @ts-expect-error
      ref.current.animate(
        [
          {opacity: 0, backgroundColor: color.dark ? 'hsla(0,0%,0%,0)' : 'hsla(0,0%,100%,0)'},
          {opacity: 1, backgroundColor: color.dark ? 'hsla(0,0%,0%,0.5)' : 'hsla(0,0%,100%,0.5)'},
        ],
        {
          duration: 300,
          fill: 'both',
        }
      )
    }
  }, [animate, color.dark])

  return (
    <FullscreenLayer ref={ref}>
      <Flex height="fill" align="center" justify="center">
        <Spinner />
      </Flex>
    </FullscreenLayer>
  )
}
// console.log(FullscreenSpinner)

interface AssetProps {
  asset: VideoAssetDocument
  isSelected: boolean
  onClick?: (...args: any[]) => any
  onKeyPress?: (...args: any[]) => any
}

// Get pixel density of the current device
const DPI =
  typeof window === 'undefined' || !window.devicePixelRatio
    ? 1
    : Math.round(window.devicePixelRatio)

const VideoMediaPreview = styled(MediaPreview)`
  position: relative;

  ${Image} + span {
    z-index: 3;
  }
`

const Root = styled.div`
  position: relative;
  display: inherit;

  button:hover,
  button:focus-visible {
    ${Image} + span {
      opacity: 0.3;
    }

    ${AnimatedImage} {
      filter: blur(0px);
      opacity: 1;
    }
  }
`

const ActionsAssetsContainer = styled.div`
  box-sizing: border-box;
  position: absolute;
  z-index: 3;
  display: none;
  top: 6px;
  right: 6px;

  ${Root} button:hover + &, ${Root} button:focus-visible + &, &:hover, &:focus-visible {
    display: block;
  }
`

export const AssetThumb = React.memo(function AssetThumb(props: AssetProps) {
  const {asset, onClick, onKeyPress, isSelected} = props
  // const [isLoadingPreview, setLoadingPreview] = useState(false)
  const [animate, shouldAnimate] = useState(false)
  const {ErrorBoundary} = useErrorBoundary()
  const isSigned = useIsSigned(asset)
  const handleDelete = useCallback(() => {
    // console.log('handleDelete')
  }, [])
  /*
  console.log(
    isLoadingPreview,
    setLoadingPreview,
    {DPI, BetterDPI: getDevicePixelRatio(), max2: getDevicePixelRatio({maxDpr: 2})},
    onClick
  )
  // */

  // const {asset, onClick, onKeyPress, isSelected} = props
  const {_id, playbackId, thumbTime, data} = asset
  const imgH = 200 * Math.max(1, DPI)
  // console.log({_id, playbackId, thumbTime, data, imgH})

  // @TODO: add a lil error boundary

  return (
    <>
      <Root>
        <Card
          as="button"
          selected={isSelected}
          tabIndex={0}
          data-id={_id}
          onClick={onClick}
          onKeyPress={onKeyPress}
          radius={2}
          padding={1}
          style={{lineHeight: 0}}
          __unstable_focusRing
          onPointerEnter={() => shouldAnimate(true)}
          onFocus={() => shouldAnimate(true)}
        >
          <VideoMediaPreview
            subtitle={
              isSigned ? (
                <Inline space={1} style={{marginTop: '-1.35em'}}>
                  <LockIcon />
                  Signed playback policy
                </Inline>
              ) : undefined
            }
            // subtitle="This Mux asset is using a signed url to secure video playback."
            title={<>{null}</>}
            media={
              <ErrorBoundary>
                <Suspense fallback={<MediaSkeleton />}>
                  <StaticPoster asset={asset} />
                </Suspense>
              </ErrorBoundary>
            }
            mediaDimensions={{aspect: 16 / 9}}
          >
            <ErrorBoundary>
              {animate && (
                <Suspense fallback={<FullscreenSpinner />}>
                  <AnimatedPoster asset={asset} />
                </Suspense>
              )}
            </ErrorBoundary>
          </VideoMediaPreview>
        </Card>
        <ActionsAssetsContainer>
          <AssetActionsMenu
            asset={asset}
            // onDelete={handleDelete}
          />
        </ActionsAssetsContainer>
      </Root>
    </>
  )
})
