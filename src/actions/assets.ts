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

/**
 * Adds a new text track to an existing asset using a VTT file URL
 */
export function addTextTrackFromUrl(
  client: SanityClient,
  assetId: string,
  vttUrl: string,
  options: {
    language_code: string
    name: string
    text_type?: 'subtitles'
  }
) {
  const {dataset} = client.config()

  return client.request<{data: MuxAsset}>({
    url: `/addons/mux/assets/${dataset}/${assetId}/tracks`,
    withCredentials: true,
    method: 'POST',
    body: {
      url: vttUrl,
      type: 'text',
      language_code: options.language_code,
      name: options.name,
      text_type: options.text_type || 'subtitles',
    },
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

/**
 * Generates subtitles automatically for an audio track
 */
export function generateSubtitles(
  client: SanityClient,
  assetId: string,
  audioTrackId: string,
  options: {
    language_code: string
    name: string
  }
) {
  const {dataset} = client.config()
  return client.request<{data: MuxAsset}>({
    url: `/addons/mux/assets/${dataset}/${assetId}/tracks/${audioTrackId}/generate-subtitles`,
    withCredentials: true,
    method: 'POST',
    body: {
      generated_subtitles: [
        {
          language_code: options.language_code,
          name: options.name,
        },
      ],
    },
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

/**
 * Deletes a text track from an asset
 */
export function deleteTextTrack(client: SanityClient, assetId: string, trackId: string) {
  const {dataset} = client.config()
  return client.request<{data: MuxAsset}>({
    url: `/addons/mux/assets/${dataset}/${assetId}/tracks/${trackId}`,
    withCredentials: true,
    method: 'DELETE',
  })
}

/**
 * Updates master access on a Mux asset.
 * @NOTE This endpoint is missing from the Mux addon for now, so it will not work.
 * @TODO Your best course of action until the endpoint becomes available is to implement your own version,
 * pointing to your own Mux API proxy. This function is the only one that needs a new implementation.
 * @see {@link https://docs.mux.com/api-reference/video/assets/update-asset-master-access}
 */
export function updateMasterAccess(
  client: SanityClient,
  assetId: string,
  masterAccess: 'temporary' | 'none'
) {
  const {dataset} = client.config()
  return client.request<{data: MuxAsset}>({
    url: `/addons/mux/assets/${dataset}/${assetId}/master-access`,
    withCredentials: true,
    method: 'PUT',
    body: {master_access: masterAccess},
  })
}