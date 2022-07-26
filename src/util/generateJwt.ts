import {sign} from 'jsonwebtoken'

import type {ThumbnailOptions} from './types'

export type Audience = 'g' | 's' | 't' | 'v'

export type Payload<T extends Audience> = T extends 'g'
  ? never
  : T extends 's'
  ? never
  : T extends 't'
  ? ThumbnailOptions
  : T extends 'v'
  ? never
  : never

export function generateJwt<T extends Audience>(
  playbackId: string,
  signingKeyId: string,
  signingKeyPrivate: string,
  aud: T,
  payload?: Payload<T>
): string {
  const privateKey = Buffer.from(signingKeyPrivate, 'base64')
  return sign(
    payload ? JSON.parse(JSON.stringify(payload, (_, v) => v ?? undefined)) : {},
    privateKey,
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
