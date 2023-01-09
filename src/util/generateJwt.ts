import type {SanityClient} from 'sanity'
import {suspend} from 'suspend-react'

import {readSecrets} from './readSecrets'
import type {AnimatedThumbnailOptions, ThumbnailOptions} from './types'

export type Audience = 'g' | 's' | 't' | 'v'

export type Payload<T extends Audience> = T extends 'g'
  ? AnimatedThumbnailOptions
  : T extends 's'
  ? never
  : T extends 't'
  ? ThumbnailOptions
  : T extends 'v'
  ? never
  : never

export function generateJwt<T extends Audience>(
  client: SanityClient,
  playbackId: string,
  aud: T,
  payload?: Payload<T>
): string {
  const {signingKeyId, signingKeyPrivate} = readSecrets(client)
  if (!signingKeyId) {
    throw new TypeError('Missing signingKeyId')
  }
  if (!signingKeyPrivate) {
    throw new TypeError('Missing signingKeyPrivate')
  }

  const {default: sign} = suspend(() => import('jsonwebtoken-esm/sign'), ['jsonwebtoken-esm/sign'])

  return sign(
    payload ? JSON.parse(JSON.stringify(payload, (_, v) => v ?? undefined)) : {},
    atob(signingKeyPrivate),
    {
      algorithm: 'RS256',
      keyid: signingKeyId,
      audience: aud,
      subject: playbackId,
      noTimestamp: true,
      expiresIn: '12h',
    }
  )
}
