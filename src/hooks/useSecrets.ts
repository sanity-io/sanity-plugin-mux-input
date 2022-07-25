import type {SanityClient} from '@sanity/client'
import {useCallback, useMemo} from 'react'
import {useSource} from 'sanity'
import {clear, peek, preload, suspend} from 'suspend-react'

import {type Secrets} from '../types'

const query = /* groq */ `*[_id == "secrets.mux"][0]`

async function fetcher(client: SanityClient): Promise<Secrets> {
  const data = await client.fetch(query)
  return {
    token: data?.token || null,
    secretKey: data?.secretKey || null,
    enableSignedUrls: Boolean(data?.enableSignedUrls) || false,
    signingKeyId: data?.signingKeyId || null,
    signingKeyPrivate: data?.signingKeyPrivate || null,
  }
}

export function useSecrets(): Secrets {
  const {client} = useSource()
  const {token, secretKey, enableSignedUrls, signingKeyId, signingKeyPrivate} = suspend(
    () => fetcher(client),
    [query]
  )
  const serialized = useMemo(
    () => JSON.stringify({token, secretKey, enableSignedUrls, signingKeyId, signingKeyPrivate}),
    [enableSignedUrls, secretKey, signingKeyId, signingKeyPrivate, token]
  )
  return useMemo(() => JSON.parse(serialized) as unknown as Secrets, [serialized])
}

function saveSecrets(
  client: SanityClient,
  {token, secretKey, enableSignedUrls, signingKeyId, signingKeyPrivate}: Secrets
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

  return client.createOrReplace(doc)
}

function createSigningKeys(client: SanityClient, dataset: string) {
  return client.request({
    url: `/addons/mux/signing-keys/${dataset}`,
    withCredentials: true,
    method: 'POST',
  })
}

async function haveValidSigningKeys(
  client: SanityClient,
  dataset: string,
  {signingKeyId, signingKeyPrivate}: Pick<Secrets, 'signingKeyId' | 'signingKeyPrivate'>
) {
  if (!(signingKeyId && signingKeyPrivate)) {
    return false
  }

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
  } catch (err) {
    console.error('Error fetching signingKeyId', signingKeyId, 'assuming it is not valid', err)
    return false
  }
}

function mutate(secrets: Secrets) {
  clear([query])
  // eslint-disable-next-line require-await
  preload(async () => secrets, [query])
}

export function useSaveSecrets() {
  const {client, dataset} = useSource()
  return useCallback(
    async ({
      token,
      secretKey,
      enableSignedUrls,
    }: Pick<Secrets, 'token' | 'secretKey' | 'enableSignedUrls'>): Promise<void> => {
      const {signingKeyId = null, signingKeyPrivate = null} =
        (peek([query]) as unknown as Secrets) || {}
      const secrets: Secrets = {
        token,
        secretKey,
        enableSignedUrls,
        // @TODO: don't unset them here, so it's possible to view signed videos
        //        unset them in hasValidSigningKeys instead
        signingKeyId: enableSignedUrls ? signingKeyId : null,
        signingKeyPrivate: enableSignedUrls ? signingKeyPrivate : null,
      }

      try {
        await saveSecrets(client, secrets)
        mutate(secrets)
      } catch (err) {
        console.error('Error while trying to save secrets:', err)
        throw err
      }

      if (enableSignedUrls) {
        const hasValidSigningKeys = await haveValidSigningKeys(client, dataset, {
          signingKeyId,
          signingKeyPrivate,
        })

        if (!hasValidSigningKeys) {
          try {
            const {data} = await createSigningKeys(client, dataset)
            // It's ok to mutate here as we shallow cloned ath the start of this function, no risk of affecting callers
            Object.assign(secrets, {signingKeyId: data.id, signingKeyPrivate: data.private_key})
            await saveSecrets(client, secrets)
            mutate(secrets)
          } catch (err) {
            // eslint-disable-next-line no-console
            console.log('Error while creating and saving signing key:', err.message)
            throw err
          }
        }
      }
    },
    [client, dataset]
  )
}

// TODO: expand to report if the credentials are wrong or missing
export function useIsSecretsConfigured(): boolean {
  const {client, dataset} = useSource()
  const {token, secretKey} = useSecrets()

  return suspend(async () => {
    if (!token || !secretKey) return false

    const result = await client.request({
      url: `/addons/mux/secrets/${dataset}/test`,
      withCredentials: true,
      method: 'GET',
    })

    return result?.status
  }, ['/addons/mux/secrets/:dataset/test', dataset, token, secretKey])
}

let init = false
export function preloadSecrets(client: SanityClient) {
  if (!init && !peek([query])) {
    init = true
    preload(() => fetcher(client), [query])
  }
}
