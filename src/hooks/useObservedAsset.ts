// Based on the WithReferencedAsset helper in sanity/form/utils
import {useDocumentPreviewStore} from 'sanity/_unstable'
import {useCallback} from 'react'
import {useMemoObservable} from 'react-rx'
import {type Observable} from 'rxjs'

import {type VideoAssetDocument, type VideoInputProps} from '../types'

export interface Props {
  reference: VideoInputProps['value']['asset']
}
export function useObservedAsset(props: Props) {
  const documentPreviewStore = useDocumentPreviewStore()
  const observeAsset = useCallback(
    (id: string) => {
      // @ts-expect-error -- figure out preview
      return documentPreviewStore.observePaths(id, [
        'thumbTime',
        'data',
        'assetId',
        'playbackId',
        'status',
      ]) as unknown as Observable<VideoAssetDocument>
    },
    [documentPreviewStore]
  )
  const {reference} = props
  const documentId = reference?._ref
  const asset = useMemoObservable(() => observeAsset(documentId), [documentId])

  return asset
}
