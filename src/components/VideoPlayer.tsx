import {type MuxPlayerProps, type MuxPlayerRefAttributes} from '@mux/mux-player-react'
import MuxPlayer from '@mux/mux-player-react/lazy'
import {ErrorOutlineIcon} from '@sanity/icons'
import {Card, Text} from '@sanity/ui'
import {type PropsWithChildren, Suspense, useMemo, useRef, useState} from 'react'

import {useDialogStateContext} from '../context/DialogStateContext'
import {useClient} from '../hooks/useClient'
import {AUDIO_ASPECT_RATIO, MIN_ASPECT_RATIO} from '../util/constants'
import {generateJwt} from '../util/generateJwt'
import {getPlaybackId} from '../util/getPlaybackPolicy'
import {getPlaybackPolicyById} from '../util/getPlaybackPolicy'
import {getPosterSrc} from '../util/getPosterSrc'
import {getVideoSrc} from '../util/getVideoSrc'
import {tryWithSuspend} from '../util/tryWithSuspend'
import type {VideoAssetDocument} from '../util/types'
import CaptionsDialog from './CaptionsDialog'
import DownloadAssetDialog from './DownloadAssetDialog'
import EditThumbnailDialog from './EditThumbnailDialog'
import {AudioIcon} from './icons/Audio'

export default function VideoPlayer({
  asset,
  thumbnailWidth = 250,
  children,
  hlsConfig,
  ...props
}: PropsWithChildren<
  {
    asset: VideoAssetDocument
    thumbnailWidth?: number
    forceAspectRatio?: number
    hlsConfig?: MuxPlayerProps['_hlsConfig']
  } & Partial<Pick<MuxPlayerProps, 'autoPlay'>>
>) {
  const client = useClient()
  const {dialogState} = useDialogStateContext()

  const isAudio = assetIsAudio(asset)
  const muxPlayer = useRef<MuxPlayerRefAttributes>(null)
  const [error, setError] = useState<Error>()

  /* Playback ID that will be used to play the video */
  const playbackId = useMemo(() => {
    try {
      return getPlaybackId(asset, ['public', 'signed', 'drm'])
    } catch (e) {
      setError(new TypeError('Asset has no playback ID'))
      return undefined
    }
  }, [asset])

  const muxPlaybackId = useMemo(() => {
    if (!playbackId) return undefined
    return getPlaybackPolicyById(asset, playbackId)
  }, [asset, playbackId])

  const src = useMemo(() => {
    if (!playbackId) return undefined
    if (!muxPlaybackId) return undefined
    return tryWithSuspend(
      () => getVideoSrc({muxPlaybackId, client}),
      (e: Error) => {
        setError(e)
        return undefined
      }
    )
  }, [muxPlaybackId, playbackId, client])

  const poster = useMemo(() => {
    return tryWithSuspend(
      () => getPosterSrc({asset, client, width: thumbnailWidth}),
      (e: Error) => {
        setError(e)
        return undefined
      }
    )
  }, [asset, client, thumbnailWidth])

  const signedToken = useMemo(() => {
    try {
      const url = new URL(src!)
      return url.searchParams.get('token')
    } catch {
      return undefined
    }
  }, [src])
  const drmToken = useMemo(() => {
    if (!playbackId) return undefined
    if (muxPlaybackId?.policy !== 'drm') return undefined

    return tryWithSuspend(
      () => generateJwt(client, playbackId, 'd'),
      (e: Error) => {
        setError(e)
        return undefined
      }
    )
  }, [client, muxPlaybackId?.policy, playbackId])
  const tokens:
    | Partial<{
        playback?: string
        thumbnail?: string
        storyboard?: string
        drm?: string
      }>
    | undefined = useMemo(() => {
    try {
      const partialTokens: {
        playback?: string
        thumbnail?: string
        storyboard?: string
        drm?: string
      } = {
        playback: undefined,
        thumbnail: undefined,
        storyboard: undefined,
        drm: undefined,
      }

      if (signedToken) {
        partialTokens.playback = signedToken
        partialTokens.thumbnail = signedToken
        partialTokens.storyboard = signedToken
      }

      if (drmToken) {
        partialTokens.drm = drmToken
      }

      return {...partialTokens}
    } catch {
      return undefined
    }
  }, [signedToken, drmToken])

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

  /* We use Suspense here because `generateJwt` and related functions use suspend()
   under the hood */
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
        {src && poster && (
          <>
            {isAudio && (
              <AudioIcon
                style={{
                  padding: '0.5em',
                  width: '2.2em',
                  height: '2.2em',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  zIndex: 1,
                }}
              />
            )}
            <Suspense fallback={null}>
              <MuxPlayer
                poster={isAudio ? undefined : poster}
                ref={muxPlayer}
                {...props}
                playsInline
                playbackId={playbackId}
                tokens={tokens}
                preload="metadata"
                crossOrigin="anonymous"
                metadata={{
                  player_name: 'Sanity Admin Dashboard',
                  player_version: process.env.PKG_VERSION,
                  page_type: 'Preview Player',
                }}
                audio={isAudio}
                _hlsConfig={hlsConfig}
                style={{
                  ...(!isAudio && {height: '100%'}),
                  width: '100%',
                  display: 'block',
                  objectFit: 'contain',
                  ...(isAudio && {alignSelf: 'end'}),
                }}
              />
              {children}
            </Suspense>
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
      {dialogState === 'edit-captions' && <CaptionsDialog asset={asset} />}
      {dialogState === 'download-asset' && <DownloadAssetDialog asset={asset} />}
    </>
  )
}

export function assetIsAudio(asset: VideoAssetDocument) {
  return asset.data?.max_stored_resolution === 'Audio only'
}
