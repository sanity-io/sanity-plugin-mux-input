import type {SanityClient} from 'sanity'

import {Audience, generateJwt} from './generateJwt'
import {getPlaybackId} from './getPlaybackId'
import {getPlaybackPolicy} from './getPlaybackPolicy'
import type {AssetThumbnailOptions} from './types'

export function createUrlParamsObject(
  client: SanityClient,
  asset: AssetThumbnailOptions['asset'],
  params: object,
  audience: Audience
) {
  const playbackId = getPlaybackId(asset)

  let searchParams = new URLSearchParams(
    JSON.parse(JSON.stringify(params, (_, v) => v ?? undefined))
  )
  if (getPlaybackPolicy(asset) === 'signed') {
    const token = generateJwt(client, playbackId, audience, params)
    searchParams = new URLSearchParams({token})
  }

  return {playbackId, searchParams}
}
