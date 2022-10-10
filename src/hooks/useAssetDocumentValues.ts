import {isReference} from 'sanity'
import {useDocumentValues} from 'sanity'

import type {Reference, VideoAssetDocument} from '../util/types'

const path = ['assetId', 'data', 'playbackId', 'status', 'thumbTime', 'filename']
export const useAssetDocumentValues = (asset: Reference | null | undefined) =>
  useDocumentValues<VideoAssetDocument | null | undefined>(
    isReference(asset) ? asset._ref! : '',
    path
  )
