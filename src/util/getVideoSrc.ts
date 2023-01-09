import type {SanityClient} from 'sanity'

import {generateJwt} from './generateJwt'
import {getPlaybackId} from './getPlaybackId'
import {getPlaybackPolicy} from './getPlaybackPolicy'
import type {MuxVideoUrl, VideoAssetDocument} from './types'

interface VideoSrcOptions {
  asset: VideoAssetDocument
  client: SanityClient
}

export function getVideoSrc({asset, client}: VideoSrcOptions): MuxVideoUrl {
  const playbackId = getPlaybackId(asset)
  const searchParams = new URLSearchParams()

  if (getPlaybackPolicy(asset) === 'signed') {
    const token = generateJwt(client, playbackId, 'v')
    searchParams.set('token', token)
  }

  return `https://stream.mux.com/${playbackId}.m3u8?${searchParams}`
}
