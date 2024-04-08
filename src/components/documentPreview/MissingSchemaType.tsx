// Adapted from https://github.com/sanity-io/sanity/blob/next/packages/sanity/src/desk/components/MissingSchemaType.tsx
import {WarningOutlineIcon} from '@sanity/icons'
import type {SanityDocument} from 'sanity'
import type {GeneralPreviewLayoutKey} from 'sanity'
import {SanityDefaultPreview} from 'sanity'

export interface MissingSchemaTypeProps {
  layout?: GeneralPreviewLayoutKey
  value: SanityDocument
}

const getUnknownTypeFallback = (id: string, typeName: string) => ({
  title: (
    <em>
      No schema found for type <code>{typeName}</code>
    </em>
  ),
  subtitle: (
    <em>
      Document: <code>{id}</code>
    </em>
  ),
  media: () => <WarningOutlineIcon />,
})

export function MissingSchemaType(props: MissingSchemaTypeProps) {
  const {layout, value} = props

  return (
    <SanityDefaultPreview {...getUnknownTypeFallback(value._id, value._type)} layout={layout} />
  )
}
