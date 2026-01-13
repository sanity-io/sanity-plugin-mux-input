import {useMemo} from 'react'
import {useDataset, useProjectId} from 'sanity'
import useSWR from 'swr'

import {useClient} from '../hooks/useClient'
import type {MuxAsset, VideoAssetDocument} from '../util/types'

// Poll MUX if it's preparing the main document or its own static renditions
export const useMuxPolling = (asset?: VideoAssetDocument) => {
  const client = useClient()
  const projectId = useProjectId()
  const dataset = useDataset()
  const isPreparingStaticRenditions = useMemo(() => {
    // Legacy: If static_renditions has a status field, it was created with mp4_support (deprecated)
    // We don't process this old format, just return false
    // Note: 'disabled' status is valid in the new format when no renditions were requested
    if (
      asset?.data?.static_renditions?.status &&
      asset?.data?.static_renditions?.status !== 'disabled'
    ) {
      return false
    }

    const files = asset?.data?.static_renditions?.files
    if (!files || files.length === 0) {
      return false
    }
    return files.some((file) => file.status === 'preparing')
  }, [asset?.data?.static_renditions?.status, asset?.data?.static_renditions?.files])

  const shouldFetch = useMemo(
    () => !!asset?.assetId && (asset?.status === 'preparing' || isPreparingStaticRenditions),
    [asset?.assetId, asset?.status, isPreparingStaticRenditions]
  )
  return useSWR(
    shouldFetch ? `/${projectId}/addons/mux/assets/${dataset}/data/${asset?.assetId}` : null,
    async () => {
      const {data} = await client.request<{data: MuxAsset}>({
        url: `/addons/mux/assets/${dataset}/data/${asset!.assetId}`,
        withCredentials: true,
        method: 'GET',
      })
      client.patch(asset!._id!).set({status: data.status, data}).commit({returnDocuments: false})
    },
    {refreshInterval: 2000, refreshWhenHidden: true, dedupingInterval: 1000}
  )
}
