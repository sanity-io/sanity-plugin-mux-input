import type {SanityClient} from 'sanity'

import {generateJwt} from './generateJwt'
import type {MuxPlaybackId, MuxVideoUrl} from './types'

interface VideoSrcOptions {
  muxPlaybackId: MuxPlaybackId
  client: SanityClient
}

/**
 * May throw a Promise. Call this with {@link tryWithSuspend} or rethrow the Promise
 */
export function getVideoSrc({client, muxPlaybackId}: VideoSrcOptions): MuxVideoUrl {
  const searchParams = new URLSearchParams()

  if (muxPlaybackId.policy === 'signed' || muxPlaybackId.policy === 'drm') {
    const token = generateJwt(client, muxPlaybackId.id, 'v')
    searchParams.set('token', token)
  }

  return `https://stream.mux.com/${muxPlaybackId.id}.m3u8?${searchParams}`
}
