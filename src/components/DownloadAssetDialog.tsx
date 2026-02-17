import {Button, Dialog, Stack, Text} from '@sanity/ui'
import {DownloadIcon, ResetIcon} from '@sanity/icons'
import React, {useEffect, useId, useState} from 'react'
import {getAsset} from '../actions/assets'

import {enableMasterAccess, waitForMasterAccess} from '../actions/download'
import {useDialogStateContext} from '../context/DialogStateContext'
import {useClient} from '../hooks/useClient'
import {DIALOGS_Z_INDEX} from '../util/constants'
import {downloadFile} from '../util/downloadFile'
import type {VideoAssetDocument} from '../util/types'

type MuxMasterAccessStatus = 'idle' | 'preparing' | 'success' | 'error'

export interface Props {
  asset: VideoAssetDocument
  onClose?: (() => void)
  absolute?: boolean
}

export default function DownloadAssetDialog({asset, onClose, absolute}: Props) {

  const client = useClient()

  const [status, setStatus] = useState<MuxMasterAccessStatus>('idle')

  const {setDialogState} = useDialogStateContext()
  const dialogId = `DownloadAssetDialog${useId()}`

  const timeout = 120
  const interval = 2

  const prepareDownload = async () => {
    const assetId = asset.assetId ?? ''
    setStatus('preparing')
    enableMasterAccess(client, assetId)
      .then(() => {
        waitForMasterAccess(client, assetId, timeout, interval)
          .then((link) => {
            setStatus((link.length > 0) ? 'success' : 'error')
          }
        )
      }
    )
  }

  const handleDownload = async () => {
    const assetId = asset.assetId ?? ''
    const assetName = asset.filename ?? 'untitled'
    getAsset(client, assetId)
      .then((res) => {
        closing()
        const url = res.data?.master?.url ?? ''
        downloadFile(url, assetName)
      }
    )
  }

  const closing = () => {
    if (onClose) onClose()
    setDialogState(false)
  }

  const behavior = {
    icon: (status === 'success') ? DownloadIcon : ResetIcon,
    text: (status === 'success') ? 'Download' : 'Retry',
    tone: (status === 'success') ? 'positive' : 'critical' as 'positive' | 'critical',
    onClick: (status === 'success') ? handleDownload : prepareDownload,
  }

  useEffect(() => { if (status === 'idle') prepareDownload() });

  return (
    <Dialog
      id={dialogId}
      header={`Download ${'asset'} (source)`}
      onClose={closing}
      position={absolute ? 'fixed' : undefined}
      zOffset={DIALOGS_Z_INDEX}
      footer={
        <Stack padding={3}>
          <Button
            icon={behavior.icon}
            key='download'
            disabled={status === 'preparing'}
            mode='ghost'
            tone={behavior.tone}
            loading={status === 'preparing'}
            onClick={behavior.onClick}
            text={behavior.text}
          />
        </Stack>
      }
    >
      <Stack paddingX={5} paddingY={3}>
        <Text hidden={(status !== 'preparing')} align={'center'}>Your download file is being prepared…</Text>
        <Text hidden={(status !== 'success')} align={'center'}>Your download file is ready.</Text>
        <Text hidden={(status !== 'error')} align={'center'}>Something went wrong during preparation :/</Text>
      </Stack>
    </Dialog>
  )
}
