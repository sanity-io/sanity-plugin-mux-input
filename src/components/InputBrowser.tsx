import {Dialog} from '@sanity/ui'
import React, {useCallback, useId} from 'react'

import type {SetDialogState} from '../hooks/useDialogState'
import SelectAsset, {type Props as SelectAssetProps} from './SelectAsset'

interface Props extends Pick<SelectAssetProps, 'onChange' | 'asset'> {
  setDialogState: SetDialogState
}
export default function InputBrowser({setDialogState, asset, onChange}: Props) {
  const id = `InputBrowser${useId()}`
  const handleClose = useCallback(() => setDialogState(false), [setDialogState])
  return (
    <Dialog
      scheme="dark"
      __unstable_autoFocus
      header="Select video"
      id={id}
      onClose={handleClose}
      width={2}
    >
      <SelectAsset asset={asset} onChange={onChange} setDialogState={setDialogState} />
    </Dialog>
  )
}
