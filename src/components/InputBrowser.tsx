import {Dialog} from '@sanity/ui'
import {useCallback, useId} from 'react'
import {styled} from 'styled-components'

import type {SetDialogState} from '../hooks/useDialogState'
import SelectAsset, {type Props as SelectAssetProps} from './SelectAsset'

/** To prevent Content Layout Shift (CLS), ensure that the dialog always occupies the entire available height. */
const StyledDialog = styled(Dialog)`
  > div[data-ui='DialogCard'] > div[data-ui='Card'] {
    height: 100%;
  }
`

export default function InputBrowser({
  setDialogState,
  asset,
  onChange,
  config,
}: Pick<SelectAssetProps, 'onChange' | 'asset' | 'config'> & {
  setDialogState: SetDialogState
}) {
  const id = `InputBrowser${useId()}`
  const handleClose = useCallback(() => setDialogState(false), [setDialogState])
  return (
    <StyledDialog
      __unstable_autoFocus
      header="Select video"
      id={id}
      onClose={handleClose}
      width={2}
    >
      <SelectAsset
        config={config}
        asset={asset}
        onChange={onChange}
        setDialogState={setDialogState}
      />
    </StyledDialog>
  )
}
