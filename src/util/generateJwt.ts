import type {SanityClient} from 'sanity'
import {suspend} from 'suspend-react'

import {readSecrets} from './readSecrets'
import type {AnimatedThumbnailOptions, ThumbnailOptions} from './types'

export type Audience = 'g' | 's' | 't' | 'v' | 'd'

export type Payload<T extends Audience> = T extends 'g'
  ? AnimatedThumbnailOptions
  : T extends 's'
    ? never
    : T extends 't'
      ? ThumbnailOptions
      : T extends 'v'
        ? never
        : T extends 'd'
          ? never
          : never

/**
 * Uses suspend. Call this with {@link tryWithSuspend} or rethrow the Promise
 */
export function generateJwt<T extends Audience>(
  client: SanityClient,
  playbackId: string,
  aud: T,
  payload?: Payload<T>
): string {
  const {signingKeyId, signingKeyPrivate} = readSecrets(client)
  if (!signingKeyId) {
    throw new TypeError("Missing `signingKeyId`.\n Check your plugin's configuration")
  }
  if (!signingKeyPrivate) {
    throw new TypeError("Missing `signingKeyPrivate`.\n Check your plugin's configuration")
  }

  /* Using suspend means we need to use Suspense on parent components. 
  Also, this will throw a Promise under the hood (apparently common in React), 
  so if we want to catch errors we have to take this into account in catch blocks
  and rethrow promises. */
  // @ts-expect-error - handle missing typings for this package
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
