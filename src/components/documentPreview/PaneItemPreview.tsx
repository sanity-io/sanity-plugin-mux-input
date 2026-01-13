// Adapted from:
// https://github.com/sanity-io/sanity/blob/next/packages/sanity/src/desk/components/paneItem/PaneItemPreview.tsx
import {Inline} from '@sanity/ui'
import {isNumber, isString} from 'lodash'
import {isValidElement, useMemo} from 'react'
import {useObservable} from 'react-rx'
import type {SanityDocument, SchemaType} from 'sanity'
import type {PreviewValue} from 'sanity'
import {
  type DocumentPresence,
  DocumentPreviewPresence,
  type DocumentPreviewStore,
  type GeneralPreviewLayoutKey,
  getPreviewStateObservable,
  getPreviewValueWithFallback,
  isRecord,
  SanityDefaultPreview,
} from 'sanity'

import {DraftStatus} from './DraftStatus'
import {PublishedStatus} from './PublishedStatus'

export interface PaneItemPreviewState {
  isLoading?: boolean
  draft?: PreviewValue | Partial<SanityDocument> | null
  published?: PreviewValue | Partial<SanityDocument> | null
}

export interface PaneItemPreviewProps {
  documentPreviewStore: DocumentPreviewStore
  icon: React.ComponentType | false
  layout: GeneralPreviewLayoutKey
  presence?: DocumentPresence[]
  schemaType: SchemaType
  value: SanityDocument
}

export function PaneItemPreview(props: PaneItemPreviewProps) {
  const {icon, layout, presence, schemaType, value} = props
  const title =
    (isRecord(value.title) && isValidElement(value.title)) ||
    isString(value.title) ||
    isNumber(value.title)
      ? value.title
      : null

  const observable = useMemo(
    () => getPreviewStateObservable(props.documentPreviewStore, schemaType, value._id),
    [props.documentPreviewStore, schemaType, value._id]
  )
  const {snapshot, original, isLoading} = useObservable(observable, {
    isLoading: true,
    snapshot: null,
    original: null,
  })

  const status = isLoading ? null : (
    <Inline space={4}>
      {presence && presence.length > 0 && <DocumentPreviewPresence presence={presence} />}
      <PublishedStatus document={original} />
      <DraftStatus document={snapshot} />
    </Inline>
  )

  return (
    <SanityDefaultPreview
      {...(getPreviewValueWithFallback({snapshot, original, fallback: {title}}) as any)}
      isPlaceholder={isLoading}
      icon={icon}
      layout={layout}
      status={status}
    />
  )
}
