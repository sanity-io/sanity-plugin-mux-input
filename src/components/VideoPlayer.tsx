import MuxPlayer, {type MuxPlayerProps} from '@mux/mux-player-react'
import {ErrorOutlineIcon} from '@sanity/icons'
import {Card, Text} from '@sanity/ui'
import {type PropsWithChildren, useMemo} from 'react'

import {useClient} from '../hooks/useClient'
import {AUDIO_ASPECT_RATIO, MIN_ASPECT_RATIO} from '../util/constants'
import {getVideoSrc} from '../util/getVideoSrc'
import type {VideoAssetDocument} from '../util/types'

export default function VideoPlayer({
  asset,
  children,
  ...props
}: PropsWithChildren<
  {asset: VideoAssetDocument; forceAspectRatio?: number} & Partial<Pick<MuxPlayerProps, 'autoPlay'>>
>) {
  const client = useClient()

  const isAudio = assetIsAudio(asset)

  const {src: videoSrc, error} = useMemo(() => {
    try {
      const src = asset?.playbackId && getVideoSrc({client, asset})
      if (src) return {src: src}

      return {error: new TypeError('Asset has no playback ID')}
      // eslint-disable-next-line @typescript-eslint/no-shadow
    } catch (error) {
      return {error}
    }
  }, [asset, client])

  const signedToken = useMemo(() => {
    try {
      const url = new URL(videoSrc!)
      return url.searchParams.get('token')
    } catch {
      return false
    }
  }, [videoSrc])

  const [width, height] = (asset?.data?.aspect_ratio ?? '16:9').split(':').map(Number)
  const targetAspectRatio =
    props.forceAspectRatio || (Number.isNaN(width) ? 16 / 9 : width / height)
  let aspectRatio = Math.max(MIN_ASPECT_RATIO, targetAspectRatio)
  if (isAudio) {
    aspectRatio = props.forceAspectRatio
      ? // Make it wider when forcing aspect ratio to balance with videos' rendering height (audio players overflow a bit)
        props.forceAspectRatio * 1.2
      : AUDIO_ASPECT_RATIO
  }

  return (
    <Card tone="transparent" style={{aspectRatio: aspectRatio, position: 'relative'}}>
      {videoSrc && (
        <>
          <MuxPlayer
            {...props}
            playsInline
            playbackId={asset.playbackId}
            tokens={
              signedToken
                ? {playback: signedToken, thumbnail: signedToken, storyboard: signedToken}
                : undefined
            }
            preload="metadata"
            crossOrigin="anonymous"
            metadata={{
              player_name: 'Sanity Admin Dashboard',
              player_version: process.env.PKG_VERSION,
              page_type: 'Preview Player',
            }}
            audio={isAudio}
            style={{
              height: '100%',
              width: '100%',
              display: 'block',
              objectFit: 'contain',
            }}
          />
          {children}
        </>
      )}
      {error ? (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <Text muted>
            <ErrorOutlineIcon style={{marginRight: '0.15em'}} />
            {typeof error === 'object' && 'message' in error && typeof error.message === 'string'
              ? error.message
              : 'Error loading video'}
          </Text>
        </div>
      ) : null}
      {children}
    </Card>
  )
}

export function assetIsAudio(asset: VideoAssetDocument) {
  return asset.data?.max_stored_resolution === 'Audio only'
}
