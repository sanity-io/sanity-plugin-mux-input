import {PlugIcon} from '@sanity/icons'
import {Button} from '@sanity/ui'
import React from 'react'
import {useClient} from 'sanity'
import styled from 'styled-components'

import type {Props as SetupProps} from './__legacy__Setup'
import SetupDialog from './SetupDialog'

const SetupButtonContainer = styled.div`
  position: relative;
  display: block;
  font-size: 0.8em;
  transform: translate(0%, -10%);
`

export interface Props extends SetupProps {
  needsSetup: boolean
  isLoading: boolean | string
  showSetup: boolean
  onSetup: () => void
}
export default function SetupButton({
  onCancel,
  onSave,
  secrets,
  onSetup,
  isLoading,
  showSetup,
  needsSetup,
}: Props) {
  const client = useClient()
  const renderSetup = !isLoading && showSetup
  return (
    <SetupButtonContainer>
      <Button
        tone={needsSetup ? 'critical' : 'positive'}
        mode="bleed"
        onClick={onSetup}
        icon={PlugIcon}
        padding={3}
        radius={3}
        aria-label="Set up Mux credentials"
      />
      {renderSetup && (
        <SetupDialog client={client} secrets={secrets} onCancel={onCancel} onSave={onSave} />
      )}
    </SetupButtonContainer>
  )
}
