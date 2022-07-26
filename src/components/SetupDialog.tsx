import {useId} from '@reach/auto-id'
import {Dialog} from '@sanity/ui'
import React from 'react'

import Setup, {type Props} from './Setup'

export default function SetupDialog({onCancel, onSave, secrets}: Props) {
  const id = `SetupDialog${useId()}`
  return (
    <Dialog id={id} onClose={onCancel} header="Mux API Credentials" width={1}>
      <Setup onSave={onSave} onCancel={onCancel} secrets={secrets} />
    </Dialog>
  )
}
