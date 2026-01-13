import {Dialog, Stack} from '@sanity/ui'
import {useId} from 'react'

import {useDialogStateContext} from '../context/DialogStateContext'
import type {VideoAssetDocument} from '../util/types'
import TextTracksManager from './TextTracksManager'

export interface Props {
  asset: VideoAssetDocument
}

export default function CaptionsDialog({asset}: Props) {
  const {setDialogState} = useDialogStateContext()
  const dialogId = `CaptionsDialog${useId()}`

  return (
    <Dialog id={dialogId} header="Edit Captions" onClose={() => setDialogState(false)} width={1}>
      <Stack padding={4}>
        <TextTracksManager asset={asset} />
      </Stack>
    </Dialog>
  )
}
