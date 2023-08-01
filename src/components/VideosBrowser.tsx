import {SearchIcon} from '@sanity/icons'
import {Card, Flex, Grid, Stack, Text, TextInput} from '@sanity/ui'
import React from 'react'

import useAssets from '../hooks/useAssets'
import type {VideoAssetDocument} from '../util/types'
import {SelectSortOptions} from './SelectSortOptions'
import SpinnerBox from './SpinnerBox'
import {FileDetailsProps} from './VideoDetails/useVideoDetails'
import VideoDetails from './VideoDetails/VideoDetails'
import VideoInBrowser from './VideoInBrowser'

export interface VideosBrowserProps {
  onSelect?: (asset: VideoAssetDocument) => void
}

export default function VideosBrowser({onSelect}: VideosBrowserProps) {
  const {assets, isLoading, searchQuery, setSearchQuery, setSort, sort} = useAssets()
  const [editedAsset, setEditedAsset] = React.useState<FileDetailsProps['asset'] | null>(null)
  const freshEditedAsset = React.useMemo(
    () => assets.find((a) => a._id === editedAsset?._id) || editedAsset,
    [editedAsset, assets]
  )

  return (
    <>
      <Stack padding={4} space={4}>
        <Flex justify="space-between" align="center">
          <Flex align="center" gap={3}>
            <TextInput
              value={searchQuery}
              icon={SearchIcon}
              onInput={(e: React.FormEvent<HTMLInputElement>) =>
                setSearchQuery(e.currentTarget.value)
              }
              placeholder="Search files"
            />
            <SelectSortOptions setSort={setSort} sort={sort} />
          </Flex>
          {/* @TODO (stretch) upload assets */}
        </Flex>
        <Stack space={2}>
          {assets?.length > 0 && (
            <Text muted>
              {assets.length} videos {searchQuery ? `matching "${searchQuery}"` : 'found'}
            </Text>
          )}
          <Grid
            gap={2}
            style={{
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            }}
          >
            {assets.map((asset) => (
              <VideoInBrowser
                key={asset._id}
                asset={asset}
                onEdit={setEditedAsset}
                onSelect={onSelect}
              />
            ))}
          </Grid>
        </Stack>
        {isLoading && <SpinnerBox />}

        {!isLoading && assets.length === 0 && (
          <Card padding={2} marginY={4} border radius={2}>
            <Text align="center" muted>
              {searchQuery ? `No videos found for "${searchQuery}"` : 'No videos in this dataset'}
            </Text>
          </Card>
        )}
      </Stack>
      {freshEditedAsset && (
        <VideoDetails
          closeDialog={() => setEditedAsset(null)}
          asset={freshEditedAsset}
          placement={onSelect ? 'input' : 'tool'}
        />
      )}
    </>
  )
}
