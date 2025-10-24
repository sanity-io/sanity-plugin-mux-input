import type {SanityClient} from 'sanity'

import type {MuxAsset, VideoAssetDocument} from '../util/types'

export function deleteAssetOnMux(client: SanityClient, assetId: string) {
  const {dataset} = client.config()
  return client.request<void>({
    url: `/addons/mux/assets/${dataset}/${assetId}`,
    withCredentials: true,
    method: 'DELETE',
  })
}

export async function deleteAsset({
  client,
  asset,
  deleteOnMux,
}: {
  client: SanityClient
  asset: VideoAssetDocument
  deleteOnMux: boolean
}) {
  if (!asset?._id) return true

  try {
    await client.delete(asset._id)
  } catch (error) {
    return 'failed-sanity'
  }

  if (deleteOnMux && asset?.assetId) {
    try {
      await deleteAssetOnMux(client, asset.assetId)
    } catch (error) {
      return 'failed-mux'
    }
  }

  return true
}

export function getAsset(client: SanityClient, assetId: string) {
  const {dataset} = client.config()
  return client.request<{data: MuxAsset}>({
    url: `/addons/mux/assets/${dataset}/data/${assetId}`,
    withCredentials: true,
    method: 'GET',
  })
}

export function listAssets(
  client: SanityClient,
  options: {limit?: number; cursor?: string | null}
) {
  const {dataset} = client.config()
  const query: {limit?: string; cursor?: string} = {}

  if (options.limit) {
    query.limit = options.limit.toString()
  }
  if (options.cursor) {
    query.cursor = options.cursor
  }

  return client.request<{data: MuxAsset[]; next_cursor?: string | null}>({
    url: `/addons/mux/assets/${dataset}/data/list`,
    withCredentials: true,
    method: 'GET',
    query,
  })
}
