import client from 'part:@sanity/base/client'

export function fetchSecrets() {
  return client.fetch('*[_id == "secrets.mux"]').then(results => {
    const secrets = {token: null, secretKey: null}
    if (results.length > 0) {
      secrets.token = results[0].token || null
      secrets.secretKey = results[0].secretKey || null
    }
    const exists = results.length !== 0
    return {secrets, exists}
  })
}

export function saveSecrets(token, secretKey) {
  const doc = {
    _id: 'secrets.mux',
    _type: 'mux.apiKey',
    token,
    secretKey
  }
  return client.createOrReplace(doc).then(res => {
    return {
      token,
      secretKey
    }
  })
}
