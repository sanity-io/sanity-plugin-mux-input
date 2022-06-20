import {useDocumentPreviewStore} from 'sanity/_unstable'
import {type Reference} from 'sanity'
import {useCallback} from 'react'
import {useMemoObservable} from 'react-rx'
import {type Observable} from 'rxjs'

import {type VideoAssetDocument} from '../types'

interface Props<AssetDoc> {
  reference?: Reference
  observeAsset?: (assetId: string) => Observable<AssetDoc>
}
export function useObservableAsset<Asset>(props: Props<Asset>) {
  const {reference} = props
  const documentPreviewStore = useDocumentPreviewStore()
  const observeAsset = useCallback(
    (id: string) => {
      // @ts-expect-error -- figure out preview
      const asset = documentPreviewStore.observePaths(id, [
        'assetId',
        'data',
        'playbackId',
        'status',
        'thumbTime',
      ])

      // TODO: implement assertion functions that type guard
      return asset
    },
    [documentPreviewStore]
  )

  const documentId = reference?._ref
  const observedAsset = useMemoObservable(() => observeAsset(documentId), [documentId])
  return observedAsset as Partial<VideoAssetDocument>
}

/*
function observeAssetDoc(documentPreviewStore: DocumentPreviewStore, id: string) {
  return documentPreviewStore.observePaths(id, [
    'originalFilename',
    'url',
    'metadata',
    'label',
    'title',
    'description',
    'creditLine',
    'source',
    'size',
  ])
}

function observeImageAsset(documentPreviewStore: DocumentPreviewStore, id: string) {
  return observeAssetDoc(documentPreviewStore, id) as Observable<ImageAsset>
}

const documentPreviewStore = useDocumentPreviewStore()

const observeAsset = useCallback(
    (id: string) => {
      return observeImageAsset(documentPreviewStore, id)
    },
    [documentPreviewStore]
  )

// */
