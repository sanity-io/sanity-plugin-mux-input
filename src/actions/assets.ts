import type {SanityClient} from '@sanity/client'

export function deleteAsset(client: SanityClient, assetId) {
  const dataset = client.clientConfig.dataset
  return client.request({
    url: `/addons/mux/assets/${dataset}/${assetId}`,
    withCredentials: true,
    method: 'DELETE',
  })
}

export function getAsset(client: SanityClient, assetId) {
  const dataset = client.clientConfig.dataset
  return client.request({
    url: `/addons/mux/assets/${dataset}/data/${assetId}`,
    withCredentials: true,
    method: 'GET',
  })
}
