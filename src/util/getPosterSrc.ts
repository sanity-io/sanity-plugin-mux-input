import type {SanityClient} from 'sanity'

import {generateJwt} from './generateJwt'
import {getPlaybackId} from './getPlaybackId'
import {getPlaybackPolicy} from './getPlaybackPolicy'
import type {MuxThumbnailUrl, ThumbnailOptions, VideoAssetDocument} from './types'

export interface PosterSrcOptions extends ThumbnailOptions {
  asset: Pick<VideoAssetDocument, 'playbackId' | 'data' | 'thumbTime'>
  client: SanityClient
}

//todo: look for reuse the logic in both static and animated.
export function getPosterSrc({
  asset,
  client,
  fit_mode,
  height,
  time = asset.thumbTime ?? 0,
  width,
}: PosterSrcOptions): MuxThumbnailUrl {
  const params = {fit_mode, height, time, width}
  const playbackId = getPlaybackId(asset)

  let searchParams = new URLSearchParams(
    JSON.parse(JSON.stringify(params, (_, v) => v ?? undefined))
  )
  if (getPlaybackPolicy(asset) === 'signed') {
    const token = generateJwt(client, playbackId, 't', params)
    searchParams = new URLSearchParams({token})
  }

  return `https://image.mux.com/${playbackId}/thumbnail.png?${searchParams}`
}
