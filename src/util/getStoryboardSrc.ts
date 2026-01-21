import type {SanityClient} from 'sanity'

import {generateJwt} from './generateJwt'
import {getPlaybackId} from './getPlaybackId'
import {getPlaybackPolicyById} from './getPlaybackPolicy'
import type {MuxStoryboardUrl, VideoAssetDocument} from './types'

interface StoryboardSrcOptions {
  asset: VideoAssetDocument
  client: SanityClient
}

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
