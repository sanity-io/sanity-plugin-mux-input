import {PlugIcon} from '@sanity/icons'
import {Button, Card, Flex, Grid, Heading, Inline} from '@sanity/ui'
import React, {useCallback} from 'react'

import type {SetDialogState} from '../hooks/useDialogState'
import MuxLogo from './MuxLogo'

interface OnboardProps {
  setDialogState: SetDialogState
}

export default function Onboard(props: OnboardProps) {
  const {setDialogState} = props
  const handleOpen = useCallback(() => setDialogState('secrets'), [setDialogState])

  return (
    <>
      <div style={{padding: 2}}>
        <Card
          display="flex"
          sizing="border"
          style={{
            aspectRatio: '16/9',
            width: '100%',
            boxShadow: 'var(--card-bg-color) 0 0 0 2px',
          }}
          paddingX={[2, 3, 4, 4]}
          radius={1}
          tone="transparent"
        >
          <Flex justify="flex-start" align="center">
            <Grid columns={1} gap={[2, 3, 4, 4]}>
              <Inline paddingY={1}>
                <div style={{height: '32px'}}>
                  <MuxLogo />
                </div>
              </Inline>
              <Inline paddingY={1}>
                <Heading size={[0, 1, 2, 2]}>
                  Upload and preview videos directly from your studio.
                </Heading>
              </Inline>
              <Inline paddingY={1}>
                <Button mode="ghost" icon={PlugIcon} text="Configure API" onClick={handleOpen} />
              </Inline>
            </Grid>
          </Flex>
        </Card>
      </div>
    </>
  )
}
