import type {SanityClient} from 'sanity'

import {generateJwt} from './generateJwt'
import {getPlaybackId} from './getPlaybackId'
import {getPlaybackPolicyById} from './getPlaybackPolicy'
import type {MuxVideoUrl, VideoAssetDocument} from './types'

interface VideoSrcOptions {
  asset: VideoAssetDocument
  client: SanityClient
}

export function getVideoSrc({asset, client}: VideoSrcOptions): MuxVideoUrl {
  const playbackId = getPlaybackId(asset)
  const searchParams = new URLSearchParams()

  const playbackPolicy = getPlaybackPolicyById(asset, playbackId)?.policy
  if (playbackPolicy === 'signed' || playbackPolicy === 'drm') {
    const token = generateJwt(client, playbackId, 'v')
    searchParams.set('token', token)
  }

  return `https://stream.mux.com/${playbackId}.m3u8?${searchParams}`
}
