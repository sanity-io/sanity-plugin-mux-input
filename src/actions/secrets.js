import {defer} from 'rxjs'
import client from 'part:@sanity/base/client'

const cache = {
  secrets: null,
  exists: false,
}

export function fetchSecrets() {
  if (!cache.exists) {
    return client.fetch('*[_id == "secrets.mux"]').then((results) => {
      if (results.length > 0) {
        cache.secrets = {
          token: results[0].token || null,
          secretKey: results[0].secretKey || null,
          enableSignedUrls: results[0].enableSignedUrls || false,
          signingKeyId: results[0].signingKeyId || null,
          signingKeyPrivate: results[0].signingKeyPrivate || null,
        }
      }
      cache.exists = results.length !== 0
      return cache
    })
  } else {
    return Promise.resolve(cache)
  }
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
  return client.createOrReplace(doc).then((res) => {
    return {
      token,
      secretKey,
      enableSignedUrls,
      signingKeyId,
      signingKeyPrivate,
    }
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
  if (!(signingKeyId && signingKeyPrivate)) return

  const dataset = client.clientConfig.dataset
  const res = await client.request({
    url: `/addons/mux/signing-keys/${dataset}/${signingKeyId}`,
    withCredentials: true,
    method: 'GET',
  })

  return res.status === 200
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
