import React, {memo} from 'react'
import {useClient} from 'sanity'
import {useDocumentPreviewStore} from 'sanity/_unstable'

import type {Config, MuxInputProps} from '../util/types'
import InputLegacy from './__legacy__Input'

export interface InputProps extends MuxInputProps {
  config: Config
}
const Input = (props: InputProps) => {
  const client = useClient()
  const previewStore = useDocumentPreviewStore()

  return <InputLegacy {...props} client={client} observePaths={previewStore.observePaths} />
}

export default memo(Input)
