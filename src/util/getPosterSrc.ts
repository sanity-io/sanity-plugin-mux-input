import {generateJwt} from './generateJwt'
import {getPlaybackId} from './getPlaybackId'
import {isSigned} from './isSigned'
import type {
  MuxThumbnailUrl,
  Secrets,
  SignableSecrets,
  ThumbnailOptions,
  VideoAssetDocument,
} from './types'

interface PosterSrcOptions extends ThumbnailOptions {
  asset: VideoAssetDocument
  secrets: Secrets | SignableSecrets
}

export default function getPosterSrc({
  asset,
  secrets,
  fit_mode,
  height,
  time = asset.thumbTime,
  width,
}: PosterSrcOptions): MuxThumbnailUrl {
  const params = {fit_mode, height, time, width}
  const playbackId = getPlaybackId(asset)

  let searchParams = new URLSearchParams(
    JSON.parse(JSON.stringify(params, (_, v) => v ?? undefined))
  )
  if (isSigned(asset, secrets as SignableSecrets)) {
    const token = generateJwt(
      playbackId,
      // eslint-disable-next-line no-warning-comments
      // @TODO figure out why isSigned doesn't manage to narrow down secrets to SignableSecrets
      (secrets as SignableSecrets).signingKeyId,
      (secrets as SignableSecrets).signingKeyPrivate,
      't',
      params
    )
    searchParams = new URLSearchParams({token})
  }

  return `https://image.mux.com/${playbackId}/thumbnail.png?${searchParams}`
}
