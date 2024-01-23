import MuxPlayer, {MuxPlayerProps} from '@mux/mux-player-react'
import {Card} from '@sanity/ui'
import {PropsWithChildren, useMemo} from 'react'

import {useClient} from '../hooks/useClient'
import {MIN_ASPECT_RATIO} from '../util/constants'
import {getVideoSrc} from '../util/getVideoSrc'
import type {VideoAssetDocument} from '../util/types'
import pluginPkg from './../../package.json'

export default function VideoPlayer({
  asset,
  children,
  ...props
}: PropsWithChildren<
  {asset: VideoAssetDocument; forceAspectRatio?: number} & Partial<Pick<MuxPlayerProps, 'autoPlay'>>
>) {
  const client = useClient()

  const videoSrc = useMemo(() => asset?.playbackId && getVideoSrc({client, asset}), [asset, client])

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
  const aspectRatio = Math.max(MIN_ASPECT_RATIO, targetAspectRatio)

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
              player_version: pluginPkg.version,
              page_type: 'Preview Player',
            }}
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
    </Card>
  )
}
