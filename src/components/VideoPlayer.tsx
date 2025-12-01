import {type MuxPlayerProps, type MuxPlayerRefAttributes} from '@mux/mux-player-react'
import MuxPlayer from '@mux/mux-player-react/lazy'
import {ErrorOutlineIcon} from '@sanity/icons'
import {Card, Text} from '@sanity/ui'
import {type PropsWithChildren, useMemo, useRef} from 'react'

import {useDialogStateContext} from '../context/DialogStateContext'
import {useClient} from '../hooks/useClient'
import {AUDIO_ASPECT_RATIO, MIN_ASPECT_RATIO} from '../util/constants'
import {getPosterSrc} from '../util/getPosterSrc'
import {getVideoSrc} from '../util/getVideoSrc'
import type {VideoAssetDocument} from '../util/types'
import EditThumbnailDialog from './EditThumbnailDialog'

export default function VideoPlayer({
  asset,
  thumbnailWidth = 250,
  children,
  ...props
}: PropsWithChildren<
  {asset: VideoAssetDocument; thumbnailWidth?: number; forceAspectRatio?: number} & Partial<
    Pick<MuxPlayerProps, 'autoPlay'>
  >
>) {
  const client = useClient()
  const {dialogState} = useDialogStateContext()

  const isAudio = assetIsAudio(asset)
  const muxPlayer = useRef<MuxPlayerRefAttributes>(null)

  const {
    src: videoSrc,
    thumbnail: thumbnailSrc,
    error,
  } = useMemo(() => {
    try {
      const thumbnail = getPosterSrc({asset, client, width: thumbnailWidth})
      const src = asset?.playbackId && getVideoSrc({client, asset})
      if (src) return {src: src, thumbnail}

      return {error: new TypeError('Asset has no playback ID')}
      // eslint-disable-next-line @typescript-eslint/no-shadow
    } catch (error) {
      return {error}
    }
  }, [asset, client, thumbnailWidth])

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
    <>
      <Card
        tone="transparent"
        style={{
          aspectRatio: aspectRatio,
          position: 'relative',
          ...(isAudio && {display: 'flex', alignItems: 'flex-end'}),
        }}
      >
        {videoSrc && (
          <>
            {isAudio && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="3em"
                viewBox="0 0 24 24"
                style={{
                  padding: '0.5em',
                  width: '32px',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  zIndex: 1,
                }}
              >
                <path
                  fill="currentColor"
                  style={{opacity: '0.65'}}
                  d="M10.75 19q.95 0 1.6-.65t.65-1.6V13h3v-2h-4v3.875q-.275-.2-.587-.288t-.663-.087q-.95 0-1.6.65t-.65 1.6t.65 1.6t1.6.65M6 22q-.825 0-1.412-.587T4 20V4q0-.825.588-1.412T6 2h8l6 6v12q0 .825-.587 1.413T18 22zm7-13V4H6v16h12V9zM6 4v5zv16z"
                />
              </svg>
            )}
            <MuxPlayer
              poster={isAudio ? undefined : thumbnailSrc}
              ref={muxPlayer}
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
                ...(!isAudio && {height: '100%'}),
                width: '100%',
                display: 'block',
                objectFit: 'contain',
                ...(isAudio && {alignSelf: 'end'}),
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

      {dialogState === 'edit-thumbnail' && (
        <EditThumbnailDialog asset={asset} currentTime={muxPlayer?.current?.currentTime} />
      )}
    </>
  )
}

export function assetIsAudio(asset: VideoAssetDocument) {
  return asset.data?.max_stored_resolution === 'Audio only'
}
