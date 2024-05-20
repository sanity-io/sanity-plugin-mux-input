import {uuid} from '@sanity/uuid'
import {useMemo, useState} from 'react'
import {
  createHookFromObservableFactory,
  type DocumentStore,
  truncateString,
  useClient,
  useDocumentStore,
} from 'sanity'

import {parseMuxDate} from '../util/parsers'
import type {MuxAsset, VideoAssetDocument} from '../util/types'
import {SANITY_API_VERSION} from './useClient'
import useMuxAssets from './useMuxAssets'
import {useSecretsDocumentValues} from './useSecretsDocumentValues'

type ImportState = 'closed' | 'idle' | 'importing' | 'done' | 'error'

export type AssetInSanity = {
  uploadId: string
  assetId: string
}

export default function useImportMuxAssets() {
  const documentStore = useDocumentStore()
  const client = useClient({
    apiVersion: SANITY_API_VERSION,
  })

  const [assetsInSanity, assetsInSanityLoading] = useAssetsInSanity(documentStore)

  const secretDocumentValues = useSecretsDocumentValues()
  const hasSecrets = !!secretDocumentValues.value.secrets?.secretKey

  const [importError, setImportError] = useState<unknown>()
  const [importState, setImportState] = useState<ImportState>('closed')
  const dialogOpen = importState !== 'closed'

  const muxAssets = useMuxAssets({
    secrets: secretDocumentValues.value.secrets,
    enabled: hasSecrets && dialogOpen,
  })

  const missingAssets = useMemo(() => {
    return assetsInSanity && muxAssets.data
      ? muxAssets.data.filter((a) => !assetExistsInSanity(a, assetsInSanity))
      : undefined
  }, [assetsInSanity, muxAssets.data])

  const [selectedAssets, setSelectedAssets] = useState<MuxAsset[]>([])

  const closeDialog = () => {
    if (importState !== 'importing') setImportState('closed')
  }
  const openDialog = () => {
    if (importState === 'closed') setImportState('idle')
  }

  async function importAssets() {
    setImportState('importing')
    const documents = selectedAssets.flatMap((asset) => muxAssetToSanityDocument(asset) || [])

    const tx = client.transaction()
    documents.forEach((doc) => tx.create(doc))

    try {
      await tx.commit({returnDocuments: false})
      setSelectedAssets([])
      setImportState('done')
    } catch (error) {
      setImportState('error')
      setImportError(error)
    }
  }

  return {
    assetsInSanityLoading,
    closeDialog,
    dialogOpen,
    importState,
    importError,
    hasSecrets,
    importAssets,
    missingAssets,
    muxAssets,
    openDialog,
    selectedAssets,
    setSelectedAssets,
  }
}

function muxAssetToSanityDocument(asset: MuxAsset): VideoAssetDocument | undefined {
  const playbackId = (asset.playback_ids || []).find((p) => p.id)?.id

  if (!playbackId) return undefined

  return {
    _id: uuid(),
    _type: 'mux.videoAsset',
    _updatedAt: new Date().toISOString(),
    _createdAt: parseMuxDate(asset.created_at).toISOString(),
    assetId: asset.id,
    playbackId,
    filename: `Asset #${truncateString(asset.id, 15)}`,
    status: asset.status,
    data: asset,
  }
}

const useAssetsInSanity = createHookFromObservableFactory<AssetInSanity[], DocumentStore>(
  (documentStore) => {
    return documentStore.listenQuery(
      /* groq */ `*[_type == "mux.videoAsset"] {
      "uploadId": coalesce(uploadId, data.upload_id),
      "assetId": coalesce(assetId, data.id),
    }`,
      {},
      {
        apiVersion: SANITY_API_VERSION,
      }
    )
  }
)

function assetExistsInSanity(asset: MuxAsset, existingAssets: AssetInSanity[]) {
  // Don't allow importing assets that are not ready
  if (asset.status !== 'ready') return false

  return existingAssets.some(
    (existing) => existing.assetId === asset.id || existing.uploadId === asset.upload_id
  )
}
