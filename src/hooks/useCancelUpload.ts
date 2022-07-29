import {useCallback} from 'react'
import {useClient} from 'sanity'
import {PatchEvent, unset} from 'sanity/form'

import {deleteAsset} from '../actions/assets'
import type {MuxInputProps, VideoAssetDocument} from '../util/types'

export const useCancelUpload = (asset: VideoAssetDocument, onChange: MuxInputProps['onChange']) => {
  const client = useClient()
  return useCallback(async () => {
    if (!asset) {
      return
    }
    console.log('onChange', onChange)
    onChange(PatchEvent.from(unset()))
    if (asset.assetId) {
      console.log('deleteAsset')
      await deleteAsset(client, asset.assetId)
    }
    if (asset._id) {
      console.log('client.delete')
      await client.delete(asset._id)
    }
  }, [asset, client, onChange])
}
