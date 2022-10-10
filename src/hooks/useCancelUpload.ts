import {useCallback} from 'react'
import {PatchEvent, unset} from 'sanity'

import {deleteAsset} from '../actions/assets'
import {useClient} from '../hooks/useClient'
import type {MuxInputProps, VideoAssetDocument} from '../util/types'

export const useCancelUpload = (asset: VideoAssetDocument, onChange: MuxInputProps['onChange']) => {
  const client = useClient()
  return useCallback(() => {
    if (!asset) {
      return
    }
    onChange(PatchEvent.from(unset()))
    if (asset.assetId) {
      deleteAsset(client, asset.assetId)
    }
    if (asset._id) {
      client.delete(asset._id)
    }
  }, [asset, client, onChange])
}
