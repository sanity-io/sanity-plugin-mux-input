import {defer} from 'rxjs'

import client from '../clients/SanityClient'
import type {Secrets} from '../util/types'

const cache: {secrets: Secrets | null; exists: boolean} = {
  secrets: null,
  exists: false,
}

export function fetchSecrets() {
  if (cache.exists) {
    return Promise.resolve(cache)
  }

  return client.fetch('*[_id == "secrets.mux"][0]').then((secrets: Secrets | null) => {
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

export function saveSecrets(
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

export function createSigningKeys() {
  const dataset = client.clientConfig.dataset
  return client.request<{data: {private_key: string; id: string; created_at: string}}>({
    url: `/addons/mux/signing-keys/${dataset}`,
    withCredentials: true,
    method: 'POST',
  })
}

export function testSecrets() {
  const dataset = client.clientConfig.dataset
  return client.request<{status: boolean}>({
    url: `/addons/mux/secrets/${dataset}/test`,
    withCredentials: true,
    method: 'GET',
  })
}

export async function haveValidSigningKeys(signingKeyId: string, signingKeyPrivate: string) {
  if (!(signingKeyId && signingKeyPrivate)) {
    return false
  }

  const dataset = client.clientConfig.dataset
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

export function testSecretsObservable() {
  const dataset = client.clientConfig.dataset
  return defer(() =>
    client.observable.request<{status: boolean}>({
      url: `/addons/mux/secrets/${dataset}/test`,
      withCredentials: true,
      method: 'GET',
    })
  )
}
