import {SearchIcon} from '@sanity/icons'
import {Card, Flex, Grid, Inline, Label, Stack, Text, TextInput} from '@sanity/ui'
import {useMemo, useState} from 'react'

import {DrmPlaybackWarningContextProvider} from '../context/DrmPlaybackWarningContext'
import useAssets from '../hooks/useAssets'
import type {PluginConfig, VideoAssetDocument} from '../util/types'
import ConfigureApi from './ConfigureApi'
import ImportVideosFromMux from './ImportVideosFromMux'
import PageSelector from './PageSelector'
import ResyncMetadata from './ResyncMetadata'
import {SelectSortOptions} from './SelectSortOptions'
import SpinnerBox from './SpinnerBox'
import type {VideoDetailsProps} from './VideoDetails/useVideoDetails'
import VideoDetails from './VideoDetails/VideoDetails'
import VideoInBrowser from './VideoInBrowser'

export interface VideosBrowserProps {
  config: PluginConfig
  onSelect?: (asset: VideoAssetDocument) => void
}

export default function VideosBrowser({onSelect, config}: VideosBrowserProps) {
  const {assets, isLoading, searchQuery, setSearchQuery, setSort, sort} = useAssets()
  const [page, setPage] = useState<number>(0)
  const pageLimit = 20
  const pageTotal = Math.floor(assets.length / pageLimit) + 1
  const [editedAsset, setEditedAsset] = useState<VideoDetailsProps['asset'] | null>(null)
  const freshEditedAsset = useMemo(
    () => assets.find((a) => a._id === editedAsset?._id) || editedAsset,
    [editedAsset, assets]
  )

  const pageStart = page * pageLimit
  const pageEnd = pageStart + pageLimit

  const placement = onSelect ? 'input' : 'tool'
  return (
    <DrmPlaybackWarningContextProvider config={config}>
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
            <PageSelector page={page} setPage={setPage} total={pageTotal} />
          </Flex>
          {placement === 'tool' && (
            <Inline space={2}>
              <ImportVideosFromMux />
              <ResyncMetadata />
              <ConfigureApi />
            </Inline>
          )}
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
            {assets.slice(pageStart, pageEnd).map((asset) => (
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
          <Card marginY={4} paddingX={4} paddingY={6} border radius={2} tone="transparent">
            <Text align="center" muted size={3}>
              {searchQuery ? `No videos found for "${searchQuery}"` : 'No videos in this dataset'}
            </Text>
          </Card>
        )}
      </Stack>
      {freshEditedAsset && (
        <VideoDetails closeDialog={() => setEditedAsset(null)} asset={freshEditedAsset} />
      )}
    </DrmPlaybackWarningContextProvider>
  )
}
