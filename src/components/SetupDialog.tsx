import {useId} from '@reach/auto-id'
import {Dialog} from '@sanity/ui'
import React from 'react'
import {useClient} from 'sanity'

import Setup, {type Props} from './__legacy__Setup'

export default function SetupDialog({onCancel, onSave, secrets}: Props) {
  const id = `SetupDialog${useId()}`
  const client = useClient()
  return (
    <Dialog id={id} onClose={onCancel} header="Mux API Credentials" width={1}>
      <Setup client={client} onSave={onSave} onCancel={onCancel} secrets={secrets} />
    </Dialog>
  )
}
