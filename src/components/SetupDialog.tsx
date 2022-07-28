import {useId} from '@reach/auto-id'
import {Box, Dialog, Flex, Spinner} from '@sanity/ui'
import React, {Suspense} from 'react'

import ConfigureApi, {type Props} from './ConfigureApi'
import {Header} from './ConfigureApi.styled'

export default function SetupDialog({onClose, onSave}: Props) {
  const id = `SetupDialog${useId()}`
  return (
    <Dialog id={id} onClose={onClose} header={<Header />} width={1}>
      <Box padding={4} style={{position: 'relative'}}>
        <Suspense
          fallback={
            <Flex justify="center">
              <Spinner muted />
            </Flex>
          }
        >
          <ConfigureApi onSave={onSave} onClose={onClose} />
        </Suspense>
      </Box>
    </Dialog>
  )
}
