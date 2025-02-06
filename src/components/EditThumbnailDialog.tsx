import {Button, Dialog, Flex, Stack, Text, TextInput} from '@sanity/ui'
import React, {useId, useMemo, useState} from 'react'
import {getDevicePixelRatio} from 'use-device-pixel-ratio'

import {useDialogStateContext} from '../context/DialogStateContext'
import {useClient} from '../hooks/useClient'
import {
  formatSecondsToHHMMSS,
  getSecondsFromTimeFormat,
  isValidTimeFormat,
} from '../util/formatSeconds'
import type {VideoAssetDocument} from '../util/types'
import VideoThumbnail from './VideoThumbnail'

export interface Props {
  asset: VideoAssetDocument
  currentTime?: number
}

export default function EditThumbnailDialog({asset, currentTime = 0}: Props) {
  const client = useClient()

  const {setDialogState} = useDialogStateContext()
  const dialogId = `EditThumbnailDialog${useId()}`

  const [timeFormatted, setTimeFormatted] = useState<string>(() =>
    formatSecondsToHHMMSS(currentTime)
  )
  const [nextTime, setNextTime] = useState<number>(currentTime)
  const [inputError, setInputError] = useState<string>('')

  const assetWithNewThumbnail = useMemo(() => ({...asset, thumbTime: nextTime}), [asset, nextTime])
  const [saving, setSaving] = useState(false)
  const [saveThumbnailError, setSaveThumbnailError] = useState<Error | null>(null)
  const handleSave = () => {
    setSaving(true)
    client
      .patch(asset._id!)
      .set({thumbTime: nextTime})
      .commit({returnDocuments: false})
      .then(() => void setDialogState(false))
      .catch(setSaveThumbnailError)
      .finally(() => void setSaving(false))
  }
  const width = 300 * getDevicePixelRatio({maxDpr: 2})

  if (saveThumbnailError) {
    // eslint-disable-next-line no-warning-comments
    // @TODO handle errors more gracefully
    throw saveThumbnailError
  }

  const handleInputChange = (event: React.FormEvent<HTMLInputElement>) => {
    const value = event.currentTarget.value
    setTimeFormatted(value)

    if (isValidTimeFormat(value)) {
      setInputError('')
      const totalSeconds = getSecondsFromTimeFormat(value)
      setNextTime(totalSeconds)
    } else {
      setInputError('Invalid time format')
    }
  }

  return (
    <Dialog
      id={dialogId}
      header="Edit thumbnail"
      onClose={() => setDialogState(false)}
      footer={
        <Stack padding={3}>
          <Button
            key="thumbnail"
            disabled={inputError !== ''}
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
          <VideoThumbnail asset={asset} width={width} staticImage />
        </Stack>
        <Stack space={2}>
          <Text size={1} weight="semibold">
            New:
          </Text>
          <VideoThumbnail asset={assetWithNewThumbnail} width={width} staticImage />
        </Stack>

        <Stack space={2}>
          <Flex align={'center'} justify={'center'}>
            <Text size={5} weight="semibold">
              Or
            </Text>
          </Flex>
        </Stack>

        <Stack space={2}>
          <Text size={1} weight="semibold">
            Selected time for thumbnail (hh:mm:ss):
          </Text>
          <TextInput
            size={1}
            value={timeFormatted}
            placeholder="hh:mm:ss"
            onChange={handleInputChange}
            customValidity={inputError}
          />
        </Stack>
      </Stack>
    </Dialog>
  )
}
