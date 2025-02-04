import {defer} from 'rxjs'
import type {SanityClient} from 'sanity'

interface SecretsDocument {
  _id: 'secrets.mux'
  _type: 'mux.apiKey'
  token: string
  secretKey: string
  enableSignedUrls: boolean
  signingKeyId: string
  signingKeyPrivate: string
}
// eslint-disable-next-line max-params
export function saveSecrets(
  client: SanityClient,
  token: string,
  secretKey: string,
  enableSignedUrls: boolean,
  signingKeyId: string,
  signingKeyPrivate: string
): Promise<SecretsDocument> {
  const doc: SecretsDocument = {
    _id: 'secrets.mux',
    _type: 'mux.apiKey',
    token,
    secretKey,
    enableSignedUrls,
    signingKeyId,
    signingKeyPrivate,
  }

  return client.createOrReplace(doc)
}

export async function createSigningKeys(client: SanityClient) {
  try {
    const {dataset} = client.config()
    const res = await client.request<{
      data: {private_key: string; id: string; created_at: string}
    }>({
      url: `/addons/mux/signing-keys/${dataset}`,
      withCredentials: true,
      method: 'POST',
    })
    return res
  } catch (error: any) {
    console.error('Error creating signing keys', error)
    const message =
      error.response?.statusCode === 401
        ? 'Unauthorized - Failed to create the Signing Key. Please ensure that the token has "System" permissions'
        : error.message
    throw new Error(message)
  }
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
