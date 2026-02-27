import {useMemo, useState} from 'react'
import {
  createHookFromObservableFactory,
  type DocumentStore,
  useClient,
  useDocumentStore,
} from 'sanity'

import {addKeysToMuxData} from '../util/addKeysToMuxData'
import {isEmptyOrPlaceholderTitle} from '../util/assetTitlePlaceholder'
import type {MuxAsset, VideoAssetDocument} from '../util/types'
import {SANITY_API_VERSION} from './useClient'
import useMuxAssets from './useMuxAssets'
import {useSecretsDocumentValues} from './useSecretsDocumentValues'

type ResyncState = 'closed' | 'idle' | 'syncing' | 'done' | 'error'

export type MatchedAsset = {
  sanityDoc: VideoAssetDocument
  muxAsset: MuxAsset | undefined
  muxTitle: string | undefined
  currentTitle: string | undefined
}

export default function useResyncMuxMetadata() {
  const documentStore = useDocumentStore()
  const client = useClient({
    apiVersion: SANITY_API_VERSION,
  })

  const [sanityAssets, sanityAssetsLoading] = useSanityAssets(documentStore)

  const secretDocumentValues = useSecretsDocumentValues()
  const hasSecrets = !!secretDocumentValues.value.secrets?.secretKey

  const [resyncError, setResyncError] = useState<unknown>()
  const [resyncState, setResyncState] = useState<ResyncState>('closed')
  const dialogOpen = resyncState !== 'closed'

  const muxAssets = useMuxAssets({
    client,
    enabled: hasSecrets && dialogOpen,
  })

  const matchedAssets = useMemo(() => {
    return sanityAssets && muxAssets.data
      ? sanityAssets.map((sanityDoc) => {
          const muxAsset = muxAssets.data?.find(
            (m) => m.id === sanityDoc.assetId || m.id === sanityDoc.data?.id
          )
          return {
            sanityDoc,
            muxAsset,
            muxTitle: muxAsset?.meta?.title,
            currentTitle: sanityDoc.filename,
          }
        })
      : undefined
  }, [sanityAssets, muxAssets.data])

  const closeDialog = () => {
    if (resyncState !== 'syncing') setResyncState('closed')
  }

  const openDialog = () => {
    if (resyncState === 'closed') setResyncState('idle')
  }

  async function syncAllVideos() {
    if (!matchedAssets) return

    setResyncState('syncing')

    try {
      const tx = client.transaction()

      matchedAssets.forEach((matched) => {
        // Update all videos with the Mux title, even if it's undefined/empty
        const newTitle = matched.muxTitle || ''
        tx.patch(matched.sanityDoc._id, {set: {filename: newTitle}})
      })

      await tx.commit({returnDocuments: false})
      setResyncState('done')
    } catch (error) {
      setResyncState('error')
      setResyncError(error)
    }
  }

  async function syncOnlyEmpty() {
    if (!matchedAssets) return

    setResyncState('syncing')

    try {
      const tx = client.transaction()

      matchedAssets.forEach((matched) => {
        // Only update if the current title is empty or has the placeholder format
        // AND there's a new title available from Mux
        if (
          matched.muxAsset &&
          matched.muxTitle &&
          isEmptyOrPlaceholderTitle(matched.currentTitle, matched.muxAsset.id)
        ) {
          tx.patch(matched.sanityDoc._id, {set: {filename: matched.muxTitle}})
        }
      })

      await tx.commit({returnDocuments: false})
      setResyncState('done')
    } catch (error) {
      setResyncState('error')
      setResyncError(error)
    }
  }

  async function syncFullData() {
    if (!matchedAssets) return

    setResyncState('syncing')

    try {
      const tx = client.transaction()

      matchedAssets.forEach((matched) => {
        if (!matched.muxAsset) return

        const dataWithKeys = addKeysToMuxData(matched.muxAsset)

        // Update all fields: filename, status, and full data from Mux
        tx.patch(matched.sanityDoc._id, {
          set: {
            filename: matched.muxTitle || matched.currentTitle || '',
            status: matched.muxAsset.status,
            data: dataWithKeys,
          },
        })
      })

      await tx.commit({returnDocuments: false})
      setResyncState('done')
    } catch (error) {
      setResyncState('error')
      setResyncError(error)
    }
  }

  return {
    sanityAssetsLoading,
    closeDialog,
    dialogOpen,
    resyncState,
    resyncError,
    hasSecrets,
    syncAllVideos,
    syncOnlyEmpty,
    syncFullData,
    matchedAssets,
    muxAssets,
    openDialog,
  }
}

const useSanityAssets = createHookFromObservableFactory<VideoAssetDocument[], DocumentStore>(
  (documentStore) => {
    return documentStore.listenQuery(
      /* groq */ `*[_type == "mux.videoAsset"]`,
      {},
      {
        apiVersion: SANITY_API_VERSION,
      }
    )
  }
)
