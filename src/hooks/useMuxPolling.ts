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
  const shouldFetch = useMemo(
    () =>
      !!asset?.assetId &&
      (asset?.status === 'preparing' || asset?.data?.static_renditions?.status === 'preparing'),
    [asset?.assetId, asset?.data?.static_renditions?.status, asset?.status]
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
