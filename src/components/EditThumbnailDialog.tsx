import {useId} from '@reach/auto-id'
import {Button, Dialog, Stack, Text} from '@sanity/ui'
import React, {useCallback, useMemo, useState} from 'react'
import {useClient} from 'sanity'
import {getDevicePixelRatio} from 'use-device-pixel-ratio'

import type {VideoAssetDocument} from '../util/types'
import {VideoThumbnail} from './VideoSource.styles'

export interface Props {
  asset: VideoAssetDocument
  getCurrentTime: () => number
  onClose: () => void
}
export default function EditThumbnailDialog({asset, getCurrentTime, onClose}: Props) {
  const client = useClient()
  const dialogId = `EditThumbnailDialog${useId()}`
  const nextTime = useMemo(() => getCurrentTime(), [getCurrentTime])
  const assetWithNewThumbnail = useMemo(() => ({...asset, thumbTime: nextTime}), [asset, nextTime])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const handleSave = useCallback(() => {
    setSaving(true)
    client
      .patch(asset._id!)
      .set({thumbTime: nextTime})
      .commit({returnDocuments: false})
      .catch(setError)
      .finally(() => setSaving(false))
  }, [asset._id, nextTime, client])
  const width = 300 * getDevicePixelRatio({maxDpr: 2})

  if (error) {
    // eslint-disable-next-line no-warning-comments
    // @TODO handle errors more gracefully
    throw error
  }

  return (
    <Dialog
      id={dialogId}
      header="Edit thumbnail"
      onClose={onClose}
      footer={
        <Stack padding={3}>
          <Button
            key="thumbnail"
            mode="ghost"
            tone="primary"
            loading={saving}
            onClick={handleSave}
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
          <VideoThumbnail asset={asset} width={width} />
        </Stack>
        <Stack space={2}>
          <Text size={1} weight="semibold">
            New:
          </Text>
          <VideoThumbnail asset={assetWithNewThumbnail} width={width} />
        </Stack>
      </Stack>
    </Dialog>
  )
}
