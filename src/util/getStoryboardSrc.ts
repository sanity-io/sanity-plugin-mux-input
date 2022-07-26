import {generateJwt} from './generateJwt'
import {getPlaybackId} from './getPlaybackId'
import {isSigned} from './isSigned'
import type {MuxStoryboardUrl, Secrets, SignableSecrets, VideoAssetDocument} from './types'

interface StoryboardSrcOptions {
  asset: VideoAssetDocument
  secrets: Secrets | SignableSecrets
}

export function getStoryboardSrc({asset, secrets}: StoryboardSrcOptions): MuxStoryboardUrl {
  const playbackId = getPlaybackId(asset)
  const searchParams = new URLSearchParams()

  if (isSigned(asset, secrets as SignableSecrets)) {
    const token = generateJwt(
      playbackId,
      // eslint-disable-next-line no-warning-comments
      // @TODO figure out why isSigned doesn't manage to narrow down secrets to SignableSecrets
      (secrets as SignableSecrets).signingKeyId,
      (secrets as SignableSecrets).signingKeyPrivate,
      's'
    )
    searchParams.set('token', token)
  }

  return `https://image.mux.com/${playbackId}/storyboard.vtt?${searchParams}`
}
