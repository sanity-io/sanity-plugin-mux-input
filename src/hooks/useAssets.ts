import {useMemo, useState} from 'react'
import {useObservable} from 'react-rx'
import {collate, DocumentStore, useDocumentStore} from 'sanity'

import {SANITY_API_VERSION} from '../hooks/useClient'
import {createSearchFilter} from '../util/createSearchFilter'
import type {VideoAssetDocument} from '../util/types'

export const ASSET_SORT_OPTIONS = {
  createdDesc: {groq: '_createdAt desc', label: 'Newest first'},
  createdAsc: {groq: '_createdAt asc', label: 'First created (oldest)'},
  filenameAsc: {groq: 'filename asc', label: 'By filename (A-Z)'},
  filenameDesc: {groq: 'filename desc', label: 'By filename (Z-A)'},
}

export type SortOption = keyof typeof ASSET_SORT_OPTIONS

const useAssetDocuments = ({
  documentStore,
  sort,
  searchQuery,
}: {
  documentStore: DocumentStore
  sort: SortOption
  searchQuery: string
}): VideoAssetDocument[] | undefined => {
  const memoizedObservable = useMemo(() => {
    const search = createSearchFilter(searchQuery)
    const filter = [`_type == "mux.videoAsset"`, ...search.filter].filter(Boolean).join(' && ')
    const sortFragment = ASSET_SORT_OPTIONS[sort].groq
    return documentStore.listenQuery(
      /* groq */ `*[${filter}] | order(${sortFragment})`,
      search.params,
      {
        apiVersion: SANITY_API_VERSION,
      }
    )
  }, [documentStore, sort, searchQuery])

  return useObservable(memoizedObservable, undefined)
}

export default function useAssets() {
  const documentStore = useDocumentStore()
  const [sort, setSort] = useState<SortOption>('createdDesc')
  const [searchQuery, setSearchQuery] = useState('')

  const assetDocumentsObservable = useAssetDocuments({documentStore, sort, searchQuery})
  const isLoading = assetDocumentsObservable === undefined
  const assets = useMemo(
    () =>
      // Avoid displaying both drafts & published assets by collating them together and giving preference to drafts
      collate<VideoAssetDocument>(assetDocumentsObservable ?? []).map(
        (collated) =>
          ({
            ...(collated.draft || collated.published || {}),
            _id: collated.id,
          }) as VideoAssetDocument
      ),
    [assetDocumentsObservable]
  )

  return {
    assets,
    isLoading,
    sort,
    searchQuery,
    setSort,
    setSearchQuery,
  }
}
