import client from '../clients/SanityClient'
import type {MuxAsset} from '../util/types'

export function deleteAsset(assetId: string) {
  const dataset = client.clientConfig.dataset
  return client.request<void>({
    url: `/addons/mux/assets/${dataset}/${assetId}`,
    withCredentials: true,
    method: 'DELETE',
  })
}

export function getAsset(assetId: string) {
  const dataset = client.clientConfig.dataset
  return client.request<{data: MuxAsset}>({
    url: `/addons/mux/assets/${dataset}/data/${assetId}`,
    withCredentials: true,
    method: 'GET',
  })
}
