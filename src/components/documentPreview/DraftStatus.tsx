// Adapted from https://github.com/sanity-io/sanity/blob/next/packages/sanity/src/desk/components/DraftStatus.tsx
import {EditIcon} from '@sanity/icons'
import {Box, Text, Tooltip} from '@sanity/ui'
import type {PreviewValue, SanityDocument} from 'sanity'
import {TextWithTone} from 'sanity'

import {TimeAgo} from './TimeAgo'

export function DraftStatus(props: {document?: PreviewValue | Partial<SanityDocument> | null}) {
  const {document} = props
  const updatedAt = document && '_updatedAt' in document && document._updatedAt

  return (
    <Tooltip
      animate
      portal
      content={
        <Box padding={2}>
          <Text size={1}>
            {document ? (
              <>Edited {updatedAt && <TimeAgo time={updatedAt} />}</>
            ) : (
              <>No unpublished edits</>
            )}
          </Text>
        </Box>
      }
    >
      <TextWithTone tone="caution" dimmed={!document} muted={!document} size={1}>
        <EditIcon />
      </TextWithTone>
    </Tooltip>
  )
}
