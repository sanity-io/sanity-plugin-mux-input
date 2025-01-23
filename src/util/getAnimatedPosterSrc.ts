import type {SanityClient} from 'sanity'

import type {AnimatedThumbnailOptions, MuxAnimatedThumbnailUrl} from './types'
import { createUrlParamsObject } from './createUrlParamsObject'
import {AssetThumbnailOptions} from './types'

export interface AnimatedPosterSrcOptions extends AnimatedThumbnailOptions {
  asset: AssetThumbnailOptions['asset']
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

  const {playbackId, searchParams} = createUrlParamsObject(client, asset, params, 'g')

  return `https://image.mux.com/${playbackId}/animated.gif?${searchParams}`
}
