// Adapted from https://github.com/sanity-io/sanity/blob/next/packages/sanity/src/desk/components/paneItem/PaneItem.tsx

import {DocumentIcon} from '@sanity/icons'
import type {PropsWithChildren} from 'react'
import React, {useMemo} from 'react'
import type {SanityDocument} from 'sanity'
import type {CollatedHit, FIXME, SchemaType} from 'sanity'
import {PreviewCard, useDocumentPresence, useDocumentPreviewStore, useSchema} from 'sanity'
import {usePaneRouter} from 'sanity/desk'
import {IntentLink} from 'sanity/router'

import {PluginPlacement} from '../../util/types'
import {MissingSchemaType} from './MissingSchemaType'
import {PaneItemPreview} from './PaneItemPreview'

interface DocumentPreviewProps {
  schemaType?: SchemaType
  documentPair: CollatedHit<SanityDocument>
  placement?: PluginPlacement
}

/**
 * Return `false` if we explicitly disable the icon.
 * Otherwise return the passed icon or the schema type icon as a backup.
 */
export function getIconWithFallback(
  icon: React.ComponentType<any> | false | undefined,
  schemaType: SchemaType | undefined,
  defaultIcon: React.ComponentType<any>
): React.ComponentType<any> | false {
  if (icon === false) {
    return false
  }

  return icon || ((schemaType && schemaType.icon) as any) || defaultIcon || false
}

/** When inside the field input, we can open the reference on a child pane */
function DocumentPreviewInInput(props: PropsWithChildren<DocumentPreviewProps>) {
  const {ChildLink} = usePaneRouter()

  return (linkProps: PropsWithChildren) => (
    <ChildLink
      childId={props.documentPair.id}
      // Pass the schemaType of the document so `paneChild` in `buildPagesStructure` can access it
      childParameters={{type: props.documentPair.type}}
    >
      {linkProps.children}
    </ChildLink>
  )
}

/** When inside the tool, we must use a regular intent link to take users to the desk tool */
function DocumentPreviewInRool(props: DocumentPreviewProps) {
  return (linkProps: PropsWithChildren) => (
    <IntentLink intent="edit" params={{id: props.documentPair.id}}>
      {linkProps.children}
    </IntentLink>
  )
}

export function DocumentPreview(props: DocumentPreviewProps) {
  const {schemaType, documentPair} = props
  const doc = documentPair?.draft || documentPair?.published
  const id = documentPair.id || ''
  const documentPreviewStore = useDocumentPreviewStore()
  const schema = useSchema()
  const documentPresence = useDocumentPresence(id)
  const hasSchemaType = Boolean(schemaType && schemaType.name && schema.get(schemaType.name))

  const PreviewComponent = useMemo(() => {
    if (!doc) return null

    if (!schemaType || !hasSchemaType) {
      return <MissingSchemaType value={doc as SanityDocument} />
    }

    return (
      <PaneItemPreview
        documentPreviewStore={documentPreviewStore}
        icon={getIconWithFallback(undefined, schemaType, DocumentIcon)}
        schemaType={schemaType}
        layout="default"
        value={doc}
        presence={documentPresence}
      />
    )
  }, [hasSchemaType, schemaType, documentPresence, doc, documentPreviewStore])

  return (
    <PreviewCard
      __unstable_focusRing
      as={
        (props.placement === 'input'
          ? DocumentPreviewInInput(props)
          : DocumentPreviewInRool(props)) as FIXME
      }
      data-as="a"
      data-ui="PaneItem"
      padding={2}
      radius={2}
      tone="inherit"
    >
      {PreviewComponent}
    </PreviewCard>
  )
}
