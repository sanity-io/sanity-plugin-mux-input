import {useState} from 'react'
import {createHookFromObservableFactory, DocumentStore, useDocumentStore} from 'sanity'

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

const useAssetDocuments = createHookFromObservableFactory<
  VideoAssetDocument[],
  {
    documentStore: DocumentStore
    sort: SortOption
    searchQuery: string
  }
>(({documentStore, sort, searchQuery}) => {
  const search = createSearchFilter(searchQuery)
  const filter = [`_type == "mux.videoAsset"`, ...search.filter].filter(Boolean).join(' && ')

  const query = ASSET_SORT_OPTIONS[sort].groq
  return documentStore.listenQuery(/* groq */ `*[${filter}] | order(${query})`, search.params, {
    apiVersion: SANITY_API_VERSION,
  })
})

export default function useAssets() {
  const documentStore = useDocumentStore()
  const [sort, setSort] = useState<SortOption>('createdDesc')
  const [searchQuery, setSearchQuery] = useState('')

  const [assets = [], isLoading] = useAssetDocuments({documentStore, sort, searchQuery})

  return {
    assets,
    isLoading,
    sort,
    searchQuery,
    setSort,
    setSearchQuery,
  }
}
