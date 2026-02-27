import type {SanityClient} from 'sanity'

import {getPlaybackId} from '../util/getPlaybackPolicy'
import {generateJwt} from './generateJwt'
import {getPlaybackPolicyById} from './getPlaybackPolicy'
import type {MuxStoryboardUrl, VideoAssetDocument} from './types'

interface StoryboardSrcOptions {
  asset: VideoAssetDocument
  client: SanityClient
}

/**
 * May throw a Promise. Call this with {@link tryWithSuspend} or rethrow the Promise
 */
export function getStoryboardSrc({asset, client}: StoryboardSrcOptions): MuxStoryboardUrl {
  const playbackId = getPlaybackId(asset)
  const searchParams = new URLSearchParams()

  const playbackPolicy = getPlaybackPolicyById(asset, playbackId)?.policy
  if (playbackPolicy === 'signed' || playbackPolicy === 'drm') {
    const token = generateJwt(client, playbackId, 's')
    searchParams.set('token', token)
  }

  return `https://image.mux.com/${playbackId}/storyboard.vtt?${searchParams}`
}
