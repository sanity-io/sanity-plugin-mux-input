import {SearchIcon} from '@sanity/icons'
import {Card, Flex, Grid, Label, Stack, Text, TextInput} from '@sanity/ui'
import React from 'react'

import useAssets from '../hooks/useAssets'
import type {VideoAssetDocument} from '../util/types'
import ImportVideosFromMux from './ImportVideosFromMux'
import {SelectSortOptions} from './SelectSortOptions'
import SpinnerBox from './SpinnerBox'
import VideoDetails from './VideoDetails/VideoDetails'
import {VideoDetailsProps} from './VideoDetails/useVideoDetails'
import VideoInBrowser from './VideoInBrowser'

export interface VideosBrowserProps {
  onSelect?: (asset: VideoAssetDocument) => void
}

export default function VideosBrowser({onSelect}: VideosBrowserProps) {
  const {assets, isLoading, searchQuery, setSearchQuery, setSort, sort} = useAssets()
  const [editedAsset, setEditedAsset] = React.useState<VideoDetailsProps['asset'] | null>(null)
  const freshEditedAsset = React.useMemo(
    () => assets.find((a) => a._id === editedAsset?._id) || editedAsset,
    [editedAsset, assets]
  )

  const placement = onSelect ? 'input' : 'tool'
  return (
    <>
      <Stack padding={4} space={4} style={{minHeight: '50vh'}}>
        <Flex justify="space-between" align="center">
          <Flex align="center" gap={3}>
            <TextInput
              value={searchQuery}
              icon={SearchIcon}
              onInput={(e: React.FormEvent<HTMLInputElement>) =>
                setSearchQuery(e.currentTarget.value)
              }
              placeholder="Search videos"
            />
            <SelectSortOptions setSort={setSort} sort={sort} />
          </Flex>
          {placement === 'tool' && <ImportVideosFromMux />}
        </Flex>
        <Stack space={3}>
          {assets?.length > 0 && (
            <Label muted>
              {assets.length} video{assets.length > 1 ? 's' : null}{' '}
              {searchQuery ? `matching "${searchQuery}"` : 'found'}
            </Label>
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
          <Card padding={4} marginY={4} border radius={2} tone="transparent">
            <Text align="center" muted size={3}>
              {searchQuery ? `No videos found for "${searchQuery}"` : 'No videos in this dataset'}
            </Text>
          </Card>
        )}
      </Stack>
      {freshEditedAsset && (
        <VideoDetails
          closeDialog={() => setEditedAsset(null)}
          asset={freshEditedAsset}
          placement={placement}
        />
      )}
    </>
  )
}
