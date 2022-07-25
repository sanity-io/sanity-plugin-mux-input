import {defer} from 'rxjs'

import client from '../clients/SanityClient'

const cache = {
  secrets: null,
  exists: false,
}

export function fetchSecrets() {
  if (cache.exists) {
    return Promise.resolve(cache)
  }

  return client.fetch('*[_id == "secrets.mux"][0]').then((secrets) => {
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

export function saveSecrets(token, secretKey, enableSignedUrls, signingKeyId, signingKeyPrivate) {
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
  return client.request({
    url: `/addons/mux/signing-keys/${dataset}`,
    withCredentials: true,
    method: 'POST',
  })
}

export function testSecrets() {
  const dataset = client.clientConfig.dataset
  return client.request({
    url: `/addons/mux/secrets/${dataset}/test`,
    withCredentials: true,
    method: 'GET',
  })
}

export async function haveValidSigningKeys(signingKeyId, signingKeyPrivate) {
  if (!(signingKeyId && signingKeyPrivate)) {
    return false
  }

  const dataset = client.clientConfig.dataset
  try {
    const res = await client.request({
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
    client.observable.request({
      url: `/addons/mux/secrets/${dataset}/test`,
      withCredentials: true,
      method: 'GET',
    })
  )
}
