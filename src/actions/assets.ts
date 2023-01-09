import type {SanityClient} from 'sanity'

import type {MuxAsset} from '../util/types'

export function deleteAsset(client: SanityClient, assetId: string) {
  const {dataset} = client.config()
  return client.request<void>({
    url: `/addons/mux/assets/${dataset}/${assetId}`,
    withCredentials: true,
    method: 'DELETE',
  })
}

export function getAsset(client: SanityClient, assetId: string) {
  const {dataset} = client.config()
  return client.request<{data: MuxAsset}>({
    url: `/addons/mux/assets/${dataset}/data/${assetId}`,
    withCredentials: true,
    method: 'GET',
  })
}
