import {EllipsisVerticalIcon, TrashIcon} from '@sanity/icons'
import {DownloadIcon} from '@sanity/icons'
import {
  Box,
  Button,
  Card,
  Checkbox,
  Dialog,
  Flex,
  Grid,
  Menu,
  MenuButton,
  MenuItem,
  Spinner,
  Stack,
  Text,
  useClickOutside,
  useToast,
} from '@sanity/ui'
import {animate} from 'motion'
import React, {memo, useCallback, useEffect, useId, useLayoutEffect, useRef, useState} from 'react'
import styled from 'styled-components'
import {getDevicePixelRatio} from 'use-device-pixel-ratio'

import {deleteAsset} from '../actions/assets'
import {useClient} from '../hooks/useClient'
import type {VideoAssetDocument} from '../util/types'
import {AnimatedVideoThumbnail, CardLoadMore, ThumbGrid, VideoThumbnail} from './VideoSource.styled'

export interface AssetActionsMenuProps {
  asset: VideoAssetDocument
}

function AssetActionsMenu(props: AssetActionsMenuProps) {
  const {asset} = props
  const id = useId()
  const [dialogState, setDialogState] = useState<false | 'show-uses' | 'confirm-delete'>()
  const [open, setOpen] = useState(false)
  const [menuElement, setMenuRef] = useState<HTMLDivElement | null>(null)

  const handleDelete = useCallback(() => setDialogState('confirm-delete'), [])
  const handleClick = useCallback(() => {
    setDialogState(false)
    setOpen(true)
  }, [setDialogState])
  const handleClose = useCallback(() => {
    setDialogState(false)
    setOpen(false)
  }, [setDialogState])

  useEffect(() => {
    if (open && dialogState) {
      setOpen(false)
    }
  }, [dialogState, open])

  useClickOutside(
    useCallback(() => setOpen(false), []),
    [menuElement]
  )

  return (
    <>
      <MenuButton
        id={`${id}-asset-menu`}
        button={
          <Button icon={EllipsisVerticalIcon} mode="ghost" onClick={handleClick} padding={2} />
        }
        menu={
          <Menu ref={setMenuRef}>
            <MenuItem tone="critical" icon={TrashIcon} text="Delete" onClick={handleDelete} />
          </Menu>
        }
        portal
        placement="right"
      />
      {dialogState === 'confirm-delete' && <DeleteDialog asset={asset} onClose={handleClose} />}
    </>
  )
}

interface DeleteDialogProps {
  asset: VideoAssetDocument
  onClose: () => void
}
function DeleteDialog(props: DeleteDialogProps) {
  const {asset, onClose} = props
  const client = useClient()
  const {push: pushToast} = useToast()
  const [deleting, setDeleting] = useState(false)
  const [deleteOnMux, setDeleteOnMux] = useState(false)
  const id = useId()
  const noPaddingOnStack = true
  const width = 200 * getDevicePixelRatio({maxDpr: 2})

  const handleDelete = useCallback(async () => {
    setDeleting(true)
    try {
      if (asset?._id) {
        await client.delete(asset._id)
      }
      if (deleteOnMux && asset?.assetId) {
        await deleteAsset(client, asset.assetId)
      }
      document
        .querySelector(`[data-id="${asset._id}"]`)
        ?.parentElement?.setAttribute?.('hidden', 'true')
    } catch (err: any) {
      console.error('Failed during delete', err)
      pushToast({
        closable: true,
        description: err?.message,
        duration: 5000,
        title: 'Uncaught error',
        status: 'error',
      })
    } finally {
      setDeleting(false)
      onClose()
    }
  }, [asset._id, asset.assetId, client, deleteOnMux, onClose, pushToast])

  return (
    <Dialog
      onClose={onClose}
      id={`${id}-confirm-delete`}
      header="Delete video"
      footer={
        <Grid padding={2} gap={2} columns={2}>
          <Button mode="bleed" text="Cancel" onClick={onClose} />
          <Button
            text="Delete"
            tone="critical"
            icon={TrashIcon}
            onClick={handleDelete}
            loading={deleting}
            // disabled={!canDelete}
          />
        </Grid>
      }
      // __unstable_autoFocus
      width={1}
    >
      <Stack
        paddingX={noPaddingOnStack ? 0 : [2, 3, 4]}
        paddingY={noPaddingOnStack ? 0 : [3, 3, 3, 4]}
        space={1}
      >
        <Card paddingX={[2, 3, 4]} paddingY={[3, 3, 3, 4]}>
          <Grid columns={3} gap={3}>
            <Flex style={{gridColumn: 'span 2'}} align="center">
              <Box padding={4}>
                <Stack space={4}>
                  <Flex align="center" as="label">
                    <Checkbox
                      checked={deleteOnMux}
                      onChange={() => setDeleteOnMux((prev) => !prev)}
                    />
                    <Text style={{margin: '0 10px'}}>Delete asset on Mux</Text>
                  </Flex>
                  <Flex align="center" as="label">
                    <Checkbox disabled checked />
                    <Text style={{margin: '0 10px'}}>Delete video from dataset</Text>
                  </Flex>
                </Stack>
              </Box>
            </Flex>
            <VideoThumbnail asset={asset} width={width} showTip />
          </Grid>
        </Card>
      </Stack>
    </Dialog>
  )
}

export interface Props {
  assets: VideoAssetDocument[]
  isLoading: boolean
  isLastPage: boolean
  onSelect: (assetId: string) => void
  onLoadMore: () => void
}

export default function VideoSource({assets, isLoading, isLastPage, onSelect, onLoadMore}: Props) {
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
          {assets.map((asset) => (
            <VideoSourceItem
              key={asset._id}
              asset={asset}
              onClick={handleClick}
              onKeyPress={handleKeyPress}
              width={width}
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

interface VideoSourceItemProps {
  asset: VideoAssetDocument
  onClick: React.MouseEventHandler<HTMLDivElement>
  onKeyPress: React.KeyboardEventHandler<HTMLDivElement>
  width: number
}
const _VideoSourceItem = ({asset, onClick, onKeyPress, width}: VideoSourceItemProps) => {
  const [hover, setHover] = useState<boolean | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    if (!ref.current || hover === null) {
      return
    }
    if (hover) {
      animate(ref.current, {opacity: 1})
    } else {
      animate(ref.current, {opacity: 0})
    }
  }, [hover])
  return (
    <Box height="fill" style={{position: 'relative'}}>
      <Card
        as="button"
        data-id={asset._id}
        onClick={onClick}
        onKeyPress={onKeyPress}
        tabIndex={0}
        radius={2}
        padding={1}
        style={{lineHeight: 0, position: 'relative'}}
        __unstable_focusRing
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <VideoThumbnail asset={asset} width={width} showTip />
        {asset?.playbackId && (
          <AnimateWrapper tone="transparent" ref={ref} margin={1} radius={1}>
            {hover !== null && <AnimatedVideoThumbnail asset={asset} width={width} />}
          </AnimateWrapper>
        )}
      </Card>
      <ActionsAssetsContainer>
        <AssetActionsMenu asset={asset} />
      </ActionsAssetsContainer>
    </Box>
  )
}
const VideoSourceItem = memo(_VideoSourceItem)
const AnimateWrapper = styled(Card)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  will-change: opacity;
  background: transparent;
  background-color: hsl(0deg 0% 0% / 33%);
  opacity: 0;
  pointer-events: none;
`

const ActionsAssetsContainer = styled.div`
  box-sizing: border-box;
  position: absolute;
  z-index: 300;
  opacity: 0;
  top: 7px;
  right: 7px;

  button:hover + &,
  button:focus-visible + &,
  &:hover,
  &:focus-visible {
    opacity: 1;
  }
`
