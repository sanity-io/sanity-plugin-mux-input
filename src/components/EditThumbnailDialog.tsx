import {useId} from '@reach/auto-id'
import {Box, Button, Dialog, Flex, Skeleton, Stack, Text} from '@sanity/ui'
import React, {memo, Suspense, useCallback, useState} from 'react'
import {useSource} from 'sanity'
import {MediaPreview} from 'sanity/_unstable'
import styled from 'styled-components'
import {getDevicePixelRatio} from 'use-device-pixel-ratio'

import {type SetDialogState} from '../hooks/useDialogState'
import {useThumbnailPng} from '../hooks/usePlaybackUrls'
import {type VideoAssetDocument} from '../types'

const MediaSkeleton = styled(Skeleton).attrs({animated: true, radius: 2})`
  width: 100%;
  height: 100%;
`

const Image = styled.img`
  position: absolute;
  z-index: 1;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  background: black;
`

const ThumbnailImage = styled(Image)`
  & + span {
    z-index: 3;
  }
`

export interface Props {
  setDialogState: SetDialogState
  asset: VideoAssetDocument
  getCurrentTime: () => number
}
function EditThumbnailDialog(props: Props) {
  const {setDialogState, asset, getCurrentTime} = props
  const {client} = useSource()
  const dialogId = useId()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const handleClose = useCallback(() => setDialogState(false), [setDialogState])
  const handleSave = useCallback(() => {
    setSaving(true)
    client
      .patch(asset._id)
      .set({thumbTime: getCurrentTime()})
      .commit({returnDocuments: false})
      .catch((err) => void setError(err))
      .finally(() => setSaving(false))
  }, [asset._id, client, getCurrentTime])

  // console.log('EditThumbnailDialog', props, {saving, setSaving, error, handleSave})
  const thumb =
    'https://images.unsplash.com/photo-1651135094094-7f2a48224da8?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=987&q=80'
  const newThumb = thumb

  return (
    <Dialog
      id={dialogId}
      header="Edit thumbnail"
      onClose={handleClose}
      footer={
        <Stack padding={3}>
          <Button
            key="thumbnail"
            mode="ghost"
            tone="primary"
            loading={saving}
            onClick={handleSave}
            // disabled={videoReadyToPlay === false}
            // onClick={handleSetThumbButton}
            // loading={thumbLoading}
            text="Set new thumbnail"
          />
        </Stack>
      }
    >
      <Stack space={3} padding={3}>
        <Stack space={2}>
          <Text size={1} weight="semibold">
            Current:
          </Text>
          <MediaPreview
            media={
              <Suspense fallback={<MediaSkeleton />}>
                <Thumbnail asset={asset} />
              </Suspense>
            }
            mediaDimensions={{aspect: 16 / 9}}
          />
        </Stack>
        <Stack space={2}>
          <Text size={1} weight="semibold">
            New:
          </Text>
          <MediaPreview
            media={
              <Suspense fallback={<MediaSkeleton />}>
                <Thumbnail asset={asset} time={getCurrentTime()} />
              </Suspense>
            }
            mediaDimensions={{aspect: 16 / 9}}
          />
        </Stack>
      </Stack>
    </Dialog>
  )
}

export interface ThumbnailProps {
  asset: VideoAssetDocument
  time?: number
}
function Thumbnail(props: ThumbnailProps) {
  const {asset, time} = props
  const width = 300 * getDevicePixelRatio({maxDpr: 2})
  const src = useThumbnailPng(asset, {
    width,
    height: Math.round((width * 9) / 16),
    fit_mode: 'smartcrop',
    time,
  })

  return <ThumbnailImage alt="" src={src} />
}

export default memo(EditThumbnailDialog)
