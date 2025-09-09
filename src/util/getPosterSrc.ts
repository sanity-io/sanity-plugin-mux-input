import type {SanityClient} from 'sanity'

import {createUrlParamsObject} from './createUrlParamsObject'
import type {MuxThumbnailUrl, ThumbnailOptions} from './types'
import {AssetThumbnailOptions} from './types'

export interface PosterSrcOptions extends ThumbnailOptions {
  asset: AssetThumbnailOptions['asset']
  client: SanityClient
}

export function getPosterSrc({
  asset,
  client,
  fit_mode,
  height,
  time = asset.thumbTime ?? undefined,
  width,
}: PosterSrcOptions): MuxThumbnailUrl {
  const params = {fit_mode, height, width}
  if (time !== undefined) {
    ;(params as any).time = time
  }

  const {playbackId, searchParams} = createUrlParamsObject(client, asset, params, 't')

  return `https://image.mux.com/${playbackId}/thumbnail.png?${searchParams}`
}
