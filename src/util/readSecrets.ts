// Utils with a readName prefix are suspendable and should only be called in the render body
// Not inside event callbacks or a useEffect.
// They may be called dynamically, unlike useEffect

// @TODO rename to readSigningPair

import type {SanityClient} from 'sanity'
import {suspend} from 'suspend-react'

import {cacheNs} from '../util/constants'
import {type Secrets} from '../util/types'

export const _id = 'secrets.mux' as const

export function readSecrets(client: SanityClient): Secrets {
  const {projectId, dataset} = client.config()
  return suspend(async () => {
    const data = await client.fetch(
      /* groq */ `*[_id == $_id][0]{
        token,
        secretKey,
        enableSignedUrls,
        signingKeyId,
        signingKeyPrivate
      }`,
      {_id}
    )
    return {
      token: data?.token || null,
      secretKey: data?.secretKey || null,
      enableSignedUrls: Boolean(data?.enableSignedUrls) || false,
      signingKeyId: data?.signingKeyId || null,
      signingKeyPrivate: data?.signingKeyPrivate || null,
    }
  }, [cacheNs, _id, projectId, dataset])
}
