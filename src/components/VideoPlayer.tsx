import MuxPlayer from '@mux/mux-player-react'
import React, {useMemo} from 'react'

import {useClient} from '../hooks/useClient'
import {getVideoSrc} from '../util/getVideoSrc'
import type {VideoAssetDocument} from '../util/types'
import pluginPkg from './../../package.json'

export default function VideoPlayer({asset}: {asset: VideoAssetDocument}) {
  const client = useClient()

  const videoSrc = useMemo(() => asset.playbackId && getVideoSrc({client, asset}), [asset, client])

  const signedToken = useMemo(() => {
    try {
      const url = new URL(videoSrc!)
      return url.searchParams.get('token')
    } catch {
      return false
    }
  }, [videoSrc])

  return (
    <MuxPlayer
      playsInline
      playbackId={`${asset.playbackId}${signedToken ? `?token=${signedToken}` : ''}`}
      streamType="on-demand"
      preload="metadata"
      crossOrigin="anonymous"
      metadata={{
        player_name: 'Sanity Admin Dashboard',
        player_version: pluginPkg.version,
        page_type: 'Preview Player',
      }}
    />
  )
}
