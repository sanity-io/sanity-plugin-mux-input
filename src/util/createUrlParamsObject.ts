import type {SanityClient} from 'sanity'

import {getPlaybackId} from '../util/getPlaybackPolicy'
import {Audience, generateJwt} from './generateJwt'
import {getPlaybackPolicyById} from './getPlaybackPolicy'
import type {AssetThumbnailOptions} from './types'

/**
 * May throw a Promise. Call this with {@link tryWithSuspend} or rethrow the Promise
 */
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
  const playbackPolicy = getPlaybackPolicyById(asset, playbackId)?.policy
  if (playbackPolicy === 'signed' || playbackPolicy === 'drm') {
    const token = generateJwt(client, playbackId, audience, params)
    searchParams = new URLSearchParams({token})
  }

  return {playbackId, searchParams}
}
