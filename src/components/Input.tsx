import {ThemeProvider} from '@sanity/ui'
import React, {useMemo} from 'react'
import {defaultTheme, useClient} from 'sanity'

import type {Config, MuxInputProps} from '../util/types'
import InputLegacy from './__legacy__Input'

const Input = (props: MuxInputProps) => {
  const {schemaType} = props
  const client = useClient()
  const config = useMemo<Config>(
    () => ({mp4_support: schemaType.options.mp4_support === 'standard' ? 'standard' : 'none'}),
    [schemaType.options.mp4_support]
  )
  // const document = useFormValue()

  return (
    <ThemeProvider theme={defaultTheme} scheme="dark">
      <InputLegacy {...props} config={config} client={client} />
    </ThemeProvider>
  )
}

export default Input
