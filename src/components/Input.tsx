import React, {useMemo} from 'react'
import {useClient} from 'sanity'
import {useDocumentPreviewStore} from 'sanity/_unstable'
import {useFormValue, useReviewChanges} from 'sanity/form'

import type {Config, MuxInputProps} from '../util/types'
import InputLegacy from './__legacy__Input'

export interface InputProps extends MuxInputProps {
  config: Config
}
const Input = (props: InputProps) => {
  const {schemaType, path} = props
  const client = useClient()
  const config = useMemo<Config>(
    () => ({mp4_support: schemaType.options.mp4_support === 'standard' ? 'standard' : 'none'}),
    [schemaType.options.mp4_support]
  )
  const previewStore = useDocumentPreviewStore()
  // const document = useFormValue()
  console.log({props}, useFormValue(path))

  return (
    <InputLegacy
      {...props}
      config={config}
      client={client}
      observePaths={previewStore.observePaths}
    />
  )
}

export default Input
