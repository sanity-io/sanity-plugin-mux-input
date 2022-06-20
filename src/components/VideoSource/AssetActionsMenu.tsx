import {useId} from '@reach/auto-id'
import {EllipsisVerticalIcon, TrashIcon} from '@sanity/icons'
import {
  Button,
  Card,
  Dialog,
  Flex,
  Grid,
  Menu,
  MenuButton,
  MenuItem,
  Stack,
  Text,
  useClickOutside,
} from '@sanity/ui'
import React, {type CSSProperties, memo, Suspense, useCallback, useEffect, useState} from 'react'
import {unstable_batchedUpdates} from 'react-dom'
import {useSource} from 'sanity'
import {getDevicePixelRatio} from 'use-device-pixel-ratio'

import {useThumbnailPng} from '../../hooks/usePlaybackUrls'
import {type VideoAssetDocument} from '../../types'

const STYLE_ASSET_IMAGE: CSSProperties = {
  aspectRatio: '16 / 9',
  width: '100%',
  objectFit: 'contain',
  objectPosition: 'center',
}
const STYLE_CONFIRM_CARD: CSSProperties = {
  gridColumn: 'span 1',
  overflow: 'hidden',
  display: 'flex',
  alignSelf: 'center',
  justifyContent: 'center',
}
const STYLE_IMAGE_WRAPPER: CSSProperties = {height: '100%'}

export interface Props {
  asset: VideoAssetDocument
  // onDelete: () => void
}

function AssetActionsMenu(props: Props) {
  const {asset} = props
  const id = useId()
  const {client, dataset} = useSource()
  const [dialogState, setDialogState] = useState<false | 'show-uses' | 'confirm-delete'>()
  const [open, setOpen] = useState(false)
  const [menuElement, setMenuRef] = useState<HTMLDivElement | null>(null)

  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<Error | null>(null)
  const handleDelete = useCallback(() => setDialogState('confirm-delete'), [])
  const handleConfirmDelete = useCallback(() => {
    if (asset._id) {
      setDeleting(true)
      client
        .delete(asset._id)
        .then(() => {
          return client.request({
            url: `/addons/mux/assets/${dataset}/${asset.assetId}`,
            withCredentials: true,
            method: 'DELETE',
          })
        })
        .then(() => {
          setDialogState(false)
        })
        .catch((error) => {
          setDeleteError(error)
        })
        .finally(() => setDeleting(false))
    }
    /*
const handleRemoveVideo = useCallback(() => {
    setIsLoading(true)
    const unsetAsset = () => {
      return new Promise<void>((resolve, reject) => {
        unstable_batchedUpdates(() => {
          setAssetDocument(null)
          setConfirmRemove(false)
          setIsLoading(false)
        })
        if (deleteOnMuxChecked || deleteAssetDocumentChecked) {
          return client
            .patch(document._id)
            .unset(['video'])
            .commit({returnDocuments: false})
            .then(() => {
              if (!assetDocument) {
                return resolve()
              }
              return client
                .delete(assetDocument._id)
                .then(() => {
                  resolve()
                })
                .catch((error) => {
                  reject(error)
                })
            })
        }
        return onChange(PatchEvent.from(unset()))
      })
    }
    return unsetAsset()
      .then(() => {
        if (deleteOnMuxChecked) {
          return deleteAsset(client, assetDocument.assetId).catch((error) => {
            setError(error)
          })
        }
        return true
      })
      .catch((error) => {
        setError(error)
      })
  }, [
    assetDocument,
    onChange,
    deleteOnMuxChecked,
    deleteAssetDocumentChecked,
    client,
    document?._id,
  ])
    //*/
  }, [asset._id, asset.assetId, client, dataset])
  // console.log('stevie', {deleting, deleteError})
  const handleClick = useCallback(() => {
    unstable_batchedUpdates(() => {
      setDialogState(false)
      setOpen(true)
    })
  }, [setDialogState])
  const handleClose = useCallback(() => {
    unstable_batchedUpdates(() => {
      setDialogState(false)
      setOpen(false)
    })
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
          <Button
            icon={EllipsisVerticalIcon}
            mode="bleed"
            tone="default"
            onClick={handleClick}
            padding={2}
          />
        }
        menu={
          <Menu ref={setMenuRef}>
            <MenuItem tone="critical" icon={TrashIcon} text="Delete" onClick={handleDelete} />
          </Menu>
        }
        portal
        placement="right"
      />
      {dialogState === 'confirm-delete' && (
        <Suspense fallback={null}>
          <DeleteDialog asset={asset} onClose={handleClose} onDelete={handleConfirmDelete} />
        </Suspense>
      )}
    </>
  )
}

interface DeleteDialogProps {
  asset: VideoAssetDocument
  onClose: () => void
  onDelete: () => void
}
function DeleteDialog(props: DeleteDialogProps) {
  const {asset, onClose, onDelete} = props
  const id = useId()
  const noPaddingOnStack = true
  const width = 200 * getDevicePixelRatio({maxDpr: 2})
  const thumbnailSrc = useThumbnailPng(asset, {
    width,
    height: Math.round((width * 9) / 16),
    fit_mode: 'smartcrop',
  })

  return (
    <Dialog
      id={`${id}-confirm-delete`}
      header="Delete asset on Mux"
      footer={
        <Grid padding={2} gap={2} columns={2}>
          <Button mode="bleed" text="Cancel" onClick={onClose} />
          <Button
            text="Delete"
            tone="critical"
            icon={TrashIcon}
            onClick={onDelete}
            // loading={isDeleting}
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
              <Text>
                You are about to delete the video{' '}
                {asset.assetId && (
                  <>
                    Asset ID <strong>{asset.assetId}</strong>
                  </>
                )}{' '}
                and its metadata on Mux.
                <br />
                <br />
                Are you sure?
              </Text>
            </Flex>
            <Card __unstable_checkered border radius={1} style={STYLE_CONFIRM_CARD}>
              <Flex align="center" justify="center" style={STYLE_IMAGE_WRAPPER}>
                <img src={thumbnailSrc} style={STYLE_ASSET_IMAGE} alt="" />
              </Flex>
            </Card>
          </Grid>
        </Card>
      </Stack>
    </Dialog>
  )
}

export default memo(AssetActionsMenu)
