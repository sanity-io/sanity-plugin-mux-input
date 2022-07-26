import {DownloadIcon} from '@sanity/icons'
import {Box, Button, Card, Flex, Spinner, Text} from '@sanity/ui'
import React, {useCallback} from 'react'
import {getDevicePixelRatio} from 'use-device-pixel-ratio'

import type {Secrets, VideoAssetDocument} from '../util/types'
import {CardLoadMore, ThumbGrid, VideoThumbnail} from './VideoSource.styles'

export interface Props {
  assets: VideoAssetDocument[]
  isLoading: boolean
  isLastPage: boolean
  secrets: Secrets
  onSelect: (assetId: string) => void
  onLoadMore: () => void
}

export default function VideoSource({
  assets,
  isLoading,
  secrets,
  isLastPage,
  onSelect,
  onLoadMore,
}: Props) {
  const handleClick = useCallback<React.MouseEventHandler<HTMLDivElement>>(
    (event) => onSelect(event.currentTarget.dataset.id!),
    [onSelect]
  )
  const handleKeyPress = useCallback<React.KeyboardEventHandler<HTMLDivElement>>(
    (event) => {
      if (event.key === 'Enter') {
        onSelect(event.currentTarget.dataset.id!)
      }
    },
    [onSelect]
  )
  const width = 200 * getDevicePixelRatio({maxDpr: 2})

  return (
    <>
      <Box padding={4}>
        <ThumbGrid gap={2}>
          {assets.map((asset) => {
            return (
              <Card
                key={asset._id}
                as="button"
                data-id={asset._id}
                onClick={handleClick}
                onKeyPress={handleKeyPress}
                tabIndex={0}
                radius={2}
                padding={1}
                style={{lineHeight: 0}}
                __unstable_focusRing
              >
                <VideoThumbnail asset={asset} secrets={secrets} width={width} />
              </Card>
            )
          })}
        </ThumbGrid>
        {isLoading && assets.length === 0 && (
          <Flex justify="center">
            <Spinner muted />
          </Flex>
        )}

        {!isLoading && assets.length === 0 && (
          <Text align="center" muted>
            No videos
          </Text>
        )}
      </Box>
      {assets.length > 0 && !isLastPage && (
        <CardLoadMore tone="default" padding={4}>
          <Flex direction="column">
            <Button
              type="button"
              icon={DownloadIcon}
              loading={isLoading}
              onClick={onLoadMore}
              text="Load more"
              tone="primary"
            />
          </Flex>
        </CardLoadMore>
      )}
    </>
  )
}
