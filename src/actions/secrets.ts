import type {SanityClient} from '@sanity/client'
import {defer} from 'rxjs'

import type {Secrets} from '../util/types'

const cache: {secrets: Secrets | null; exists: boolean} = {
  secrets: null,
  exists: false,
}

export function fetchSecrets(client: SanityClient) {
  if (cache.exists) {
    return Promise.resolve(cache)
  }

  return client.fetch(/* groq */ `*[_id == "secrets.mux"][0]`).then((secrets: Secrets | null) => {
    cache.exists = Boolean(secrets)
    cache.secrets = {
      token: secrets?.token || null,
      secretKey: secrets?.secretKey || null,
      enableSignedUrls: secrets?.enableSignedUrls || false,
      signingKeyId: secrets?.signingKeyId || null,
      signingKeyPrivate: secrets?.signingKeyPrivate || null,
    }
    return cache
  })
}

// eslint-disable-next-line max-params
export function saveSecrets(
  client: SanityClient,
  token: string,
  secretKey: string,
  enableSignedUrls: boolean,
  signingKeyId: string,
  signingKeyPrivate: string
) {
  const doc = {
    _id: 'secrets.mux',
    _type: 'mux.apiKey',
    token,
    secretKey,
    enableSignedUrls,
    signingKeyId,
    signingKeyPrivate,
  }

  return client.createOrReplace(doc).then(() => {
    cache.exists = true
    cache.secrets = {
      token,
      secretKey,
      enableSignedUrls,
      signingKeyId,
      signingKeyPrivate,
    }
    return cache.secrets
  })
}

export function createSigningKeys(client: SanityClient) {
  const {dataset} = client.config()
  return client.request<{data: {private_key: string; id: string; created_at: string}}>({
    url: `/addons/mux/signing-keys/${dataset}`,
    withCredentials: true,
    method: 'POST',
  })
}

export function testSecrets(client: SanityClient) {
  const {dataset} = client.config()
  return client.request<{status: boolean}>({
    url: `/addons/mux/secrets/${dataset}/test`,
    withCredentials: true,
    method: 'GET',
  })
}

export async function haveValidSigningKeys(
  client: SanityClient,
  signingKeyId: string,
  signingKeyPrivate: string
) {
  if (!(signingKeyId && signingKeyPrivate)) {
    return false
  }

  const {dataset} = client.config()
  try {
    const res = await client.request<{data: {id: string; created_at: string}}>({
      url: `/addons/mux/signing-keys/${dataset}/${signingKeyId}`,
      withCredentials: true,
      method: 'GET',
    })
    //
    // if this signing key is valid it will return { data: { id: 'xxxx' } }
    //
    return !!(res.data && res.data.id)
  } catch (e) {
    console.error('Error fetching signingKeyId', signingKeyId, 'assuming it is not valid')
    return false
  }
}

export function testSecretsObservable(client: SanityClient) {
  const {dataset} = client.config()
  return defer(() =>
    client.observable.request<{status: boolean}>({
      url: `/addons/mux/secrets/${dataset}/test`,
      withCredentials: true,
      method: 'GET',
    })
  )
}
