import {areSecretsSignable} from './areSecretsSignable'
import type {Secrets, VideoAssetDocument} from './types'

export function isSigned(asset: VideoAssetDocument, secrets: Secrets): boolean {
  const isAssetSigned = asset.data?.playback_ids?.[0]?.policy === 'signed'
  if (!isAssetSigned) {
    return false
  }

  if (areSecretsSignable(secrets)) {
    return true
  }
  console.error(
    'Asset is signed',
    {asset},
    'but secrets are missing signingKeyId and signingKeyPrivate',
    secrets
  )
  throw new TypeError(`Unable to access asset as signing keys are missing`)
}
