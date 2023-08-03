// Adapted from https://github.com/sanity-io/sanity/blob/next/packages/sanity/src/desk/components/PublishedStatus.tsx

import {PublishIcon} from '@sanity/icons'
import type {PreviewValue, SanityDocument} from '@sanity/types'
import {Box, Text, Tooltip} from '@sanity/ui'
import React from 'react'
import {TextWithTone} from 'sanity'

import {TimeAgo} from './TimeAgo'

export function PublishedStatus(props: {document?: PreviewValue | Partial<SanityDocument> | null}) {
  const {document} = props
  const updatedAt = document && '_updatedAt' in document && document._updatedAt

  return (
    <Tooltip
      portal
      content={
        <Box padding={2}>
          <Text size={1}>
            {document ? (
              <>Published {updatedAt && <TimeAgo time={updatedAt} />}</>
            ) : (
              <>Not published</>
            )}
          </Text>
        </Box>
      }
    >
      <TextWithTone tone="positive" dimmed={!document} muted={!document} size={1}>
        <PublishIcon />
      </TextWithTone>
    </Tooltip>
  )
}
