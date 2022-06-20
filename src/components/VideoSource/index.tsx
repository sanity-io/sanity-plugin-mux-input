import {useId} from '@reach/auto-id'
import {DownloadIcon} from '@sanity/icons'
import {Box, Button, Card, Dialog, Flex, Grid, Spinner, Text} from '@sanity/ui'
import React, {forwardRef, memo, useCallback, useEffect, useMemo, useRef, useState} from 'react'
import type {Subscription} from 'rxjs'
import {useSource} from 'sanity'
import {PatchEvent, set, setIfMissing} from 'sanity/form'
import styled from 'styled-components'

import {type SetDialogState} from '../../hooks/useDialogState'
import videoAsset from '../../schema/mux.videoAsset'
import {type VideoAssetDocument, type VideoInputProps} from '../../types'
import {AssetThumb} from './AssetThumb'

const PER_PAGE = 20

const VIDEO_ASSET_TYPE = videoAsset.name
const buildQuery = (start = 0, end = PER_PAGE) =>
  `*[_type == "${VIDEO_ASSET_TYPE}"] | order(_updatedAt desc) [${start}...${end}] {_id, playbackId, thumbTime, data, assetId, filename}`

const ThumbGrid = styled(Grid)`
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
`

const CardLoadMore = styled(Card)`
  border-top: 1px solid var(--card-border-color);
  position: sticky;
  bottom: 0;
  z-index: 200;
`

export interface VideoSourceProps extends Pick<VideoInputProps, 'onChange' | 'value'> {
  setDialogState: SetDialogState
}
function VideoAssetSource(props: VideoSourceProps, ref: React.ForwardedRef<HTMLDivElement>) {
  const {client} = useSource()
  const versionedClient = useMemo(() => client.withConfig({apiVersion: '1'}), [client])
  const {setDialogState, onChange, value} = props
  const currentPageNumber = useRef(0)
  const fetch$ = useRef<Subscription>()
  const handleClose = useCallback(() => setDialogState(false), [setDialogState])
  const dialogId = useId()
  const [assets, setAssets] = useState<VideoAssetDocument[]>([])
  const [isLastPage, setIsLastPage] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // eslint-disable-next-line no-console
  console.log('VideoSource', {
    useRef,
    client,
    assets,
    setAssets,
    isLastPage,
    setIsLastPage,
    isLoading,
    setIsLoading,
    value,
  })

  const fetchPage = useCallback(
    (pageNumber: number) => {
      const start = pageNumber * PER_PAGE
      const end = start + PER_PAGE
      const tag = `${VIDEO_ASSET_TYPE}-list`

      setIsLoading(true)

      fetch$.current = versionedClient.observable
        .fetch(buildQuery(start, end), {}, {tag})
        .subscribe((result) => {
          setIsLastPage(result.length < PER_PAGE)
          // eslint-disable-next-line max-nested-callbacks
          setAssets((prevState) => prevState.concat(result))
          setIsLoading(false)
        })
    },
    [versionedClient.observable]
  )

  const select = useCallback(
    (id: string) => {
      const selected = assets.find((doc) => doc._id === id)

      if (selected) {
        onChange(
          PatchEvent.from([
            setIfMissing({_ref: selected._id, _weak: true}, ['asset']),
            set(selected._id, ['asset', '_ref']),
          ])
        )
        setDialogState(false)
      }
    },
    [assets, onChange, setDialogState]
  )

  const handleItemClick = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault()

      select(event.currentTarget.getAttribute('data-id'))
    },
    [select]
  )

  const handleItemKeyPress = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault()
        select(event.currentTarget.getAttribute('data-id'))
      }
    },
    [select]
  )

  const handleFetchNextPage = useCallback(
    (event) => {
      event.preventDefault()
      fetchPage(++currentPageNumber.current)
    },
    [fetchPage]
  )

  useEffect(() => {
    fetchPage(currentPageNumber.current)

    return () => {
      if (fetch$.current) {
        fetch$.current.unsubscribe()
      }
    }
  }, [fetchPage])

  return (
    <Dialog
      ref={ref}
      id={dialogId}
      header="Select video"
      width={2}
      onClose={handleClose}
      //__unstable_autoFocus={hasResetAutoFocus}  // eslint-disable-line
    >
      <Box padding={4}>
        <ThumbGrid gap={2}>
          {assets.map((asset) => (
            <AssetThumb
              key={asset._id}
              asset={asset}
              isSelected={value?.asset?._ref && value.asset._ref === asset._id}
              onClick={handleItemClick}
              onKeyPress={handleItemKeyPress}
            />
          ))}
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
              onClick={handleFetchNextPage}
              text="Load more"
              tone="primary"
            />
          </Flex>
        </CardLoadMore>
      )}
    </Dialog>
  )
}

export default memo(forwardRef(VideoAssetSource))
