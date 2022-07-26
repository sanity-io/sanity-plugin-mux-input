import {Stack, Text} from '@sanity/ui'
import React from 'react'

import MuxLogo from './MuxLogo'

export interface Props {
  isLoading: boolean | string
  isInitialSetup: boolean
}

const SetupNotice = ({isLoading, isInitialSetup}: Props) => {
  if (isLoading) {
    return null
  }

  return (
    <Stack padding={4} space={5} style={{backgroundColor: '#efefefef', borderRadius: 3}}>
      <MuxLogo />
      <Stack space={4}>
        {isInitialSetup && (
          <Text>
            Looks like this is the first time you are using the Mux video plugin in this dataset.
            Great!
          </Text>
        )}
        <Text>Before you can upload video, you must set your Mux credentials.</Text>
        <Text>Click the plugin button in the field title to open Setup.</Text>
      </Stack>
    </Stack>
  )
}

export default SetupNotice
