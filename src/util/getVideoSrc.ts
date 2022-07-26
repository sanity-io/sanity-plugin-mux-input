import {generateJwt} from './generateJwt'
import {getPlaybackId} from './getPlaybackId'
import {isSigned} from './isSigned'
import type {MuxVideoUrl, Secrets, SignableSecrets, VideoAssetDocument} from './types'

interface VideoSrcOptions {
  asset: VideoAssetDocument
  secrets: Secrets | SignableSecrets
}

export function getVideoSrc({asset, secrets}: VideoSrcOptions): MuxVideoUrl {
  const playbackId = getPlaybackId(asset)
  const searchParams = new URLSearchParams()

  if (isSigned(asset, secrets as SignableSecrets)) {
    const token = generateJwt(
      playbackId,
      // eslint-disable-next-line no-warning-comments
      // @TODO figure out why isSigned doesn't manage to narrow down secrets to SignableSecrets
      (secrets as SignableSecrets).signingKeyId,
      (secrets as SignableSecrets).signingKeyPrivate,
      'v'
    )
    searchParams.set('token', token)
  }

  return `https://stream.mux.com/${playbackId}.m3u8?${searchParams}`
}
