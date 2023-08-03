import type {SanityClient} from 'sanity'

import {generateJwt} from './generateJwt'
import {getPlaybackId} from './getPlaybackId'
import {getPlaybackPolicy} from './getPlaybackPolicy'
import type {AnimatedThumbnailOptions, MuxAnimatedThumbnailUrl, VideoAssetDocument} from './types'

export interface AnimatedPosterSrcOptions extends AnimatedThumbnailOptions {
  asset: Partial<VideoAssetDocument>
  client: SanityClient
}

export function getAnimatedPosterSrc({
  asset,
  client,
  height,
  width,
  start = asset.thumbTime ? Math.max(0, asset.thumbTime - 2.5) : 0,
  end = start + 5,
  fps = 15,
}: AnimatedPosterSrcOptions): MuxAnimatedThumbnailUrl {
  const params = {height, width, start, end, fps}
  const playbackId = getPlaybackId(asset)

  let searchParams = new URLSearchParams(
    JSON.parse(JSON.stringify(params, (_, v) => v ?? undefined))
  )
  if (getPlaybackPolicy(asset) === 'signed') {
    const token = generateJwt(client, playbackId, 'g', params)
    searchParams = new URLSearchParams({token})
  }

  return `https://image.mux.com/${playbackId}/animated.gif?${searchParams}`
}
