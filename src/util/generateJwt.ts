import type {SanityClient} from '@sanity/client'
import {suspend} from 'suspend-react'

import {readSecrets} from './readSecrets'
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

  const {default: sign}: {default: typeof import('jsonwebtoken-esm/sign')['default']} =
    suspend(async () => {
      const local = await import('jsonwebtoken-esm/sign')
      if (!local.default) {
        // Fallback to loading on demand if the local bundling minified to agressively for some reason
        return import(
          // @ts-expect-error - this is a dynamic import that loads on runtime
          new URL(
            'https://cdn.skypack.dev/pin/jsonwebtoken-esm@v1.0.3-p8N0qksX2r9oYz3jfz0a/mode=imports,min/optimized/jsonwebtoken-esm/sign.js'
          )
        )
      }
      return local
    }, ['sanity-plugin-mux-input', 'jsonwebtoken-esm/sign'])

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
