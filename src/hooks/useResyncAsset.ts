import {useToast} from '@sanity/ui'
import {useCallback, useState} from 'react'

import {getAsset} from '../actions/assets'
import {addKeysToMuxData} from '../util/addKeysToMuxData'
import type {MuxAsset, VideoAssetDocument} from '../util/types'
import {useClient} from './useClient'

type ResyncAssetState = 'idle' | 'syncing' | 'success' | 'error'

interface UseResyncAssetOptions {
  showToast?: boolean
  onSuccess?: (updatedData: MuxAsset) => void
  onError?: (error: unknown) => void
}

interface UseResyncAssetReturn {
  resyncState: ResyncAssetState
  resyncError: unknown
  resyncAsset: (asset: VideoAssetDocument) => Promise<MuxAsset | undefined>
  isResyncing: boolean
}

export function useResyncAsset(options?: UseResyncAssetOptions): UseResyncAssetReturn {
  const client = useClient()
  const toast = useToast()
  const [resyncState, setResyncState] = useState<ResyncAssetState>('idle')
  const [resyncError, setResyncError] = useState<unknown>(null)

  const showToast = options?.showToast ?? false

  const resyncAsset = useCallback(
    async (asset: VideoAssetDocument) => {
      if (!asset.assetId) {
        if (showToast) {
          toast.push({
            title: 'Cannot resync',
            description: 'Asset has no Mux ID',
            status: 'error',
          })
        }
        options?.onError?.(new Error('Asset has no Mux ID'))
        return undefined
      }

      if (!asset._id) {
        if (showToast) {
          toast.push({
            title: 'Cannot resync',
            description: 'Asset has no document ID',
            status: 'error',
          })
        }
        options?.onError?.(new Error('Asset has no document ID'))
        return undefined
      }

      setResyncState('syncing')
      setResyncError(null)

      try {
        const response = await getAsset(client, asset.assetId)
        const muxData = response.data
        const dataWithKeys = addKeysToMuxData(muxData)

        await client
          .patch(asset._id)
          .set({
            status: muxData.status,
            data: dataWithKeys,
            ...(muxData.meta?.title && {filename: muxData.meta.title}),
          })
          .commit({returnDocuments: false})

        setResyncState('success')
        if (showToast) {
          toast.push({
            title: 'Asset synced',
            description: 'Data has been updated from Mux',
            status: 'success',
          })
        }

        options?.onSuccess?.(muxData)
        return muxData
      } catch (error) {
        setResyncState('error')
        setResyncError(error)
        console.error('Failed to refresh asset data:', error)
        if (showToast) {
          toast.push({
            title: 'Sync failed',
            description: 'Could not sync asset from Mux',
            status: 'error',
          })
        }
        options?.onError?.(error)
        return undefined
      }
    },
    [client, toast, options, showToast]
  )

  return {
    resyncState,
    resyncError,
    resyncAsset,
    isResyncing: resyncState === 'syncing',
  }
}
