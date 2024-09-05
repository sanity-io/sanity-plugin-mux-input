import type {SanityClient} from 'sanity'

import type {MuxAsset, VideoAssetDocument} from '../util/types'

export function deleteTrackOnMux(client: SanityClient, assetId: string, trackId: string) {
  const {dataset} = client.config()
  return client.request<void>({
    url: `/addons/mux/assets/${dataset}/${assetId}/tracks/${trackId}`,
    withCredentials: true,
    method: 'DELETE',
  })
}

export function generateTrackSubtitlesOnMux(
  client: SanityClient,
  assetId: string,
  trackId: string
) {
  const {dataset} = client.config()
  return client.request<void>({
    url: `/addons/mux/assets/${dataset}/${assetId}/tracks/${trackId}/generate-subtitles`,
    body: {
      generated_subtitles: [
        {
          language_code: 'en',
          name: 'English (generated)',
          passthrough: 'English (generated)',
        },
      ],
    },
    withCredentials: true,
    method: 'POST',
  })
}

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
