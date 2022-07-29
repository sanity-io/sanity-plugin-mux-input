import {PlugIcon} from '@sanity/icons'
import {Button} from '@sanity/ui'
import React from 'react'
import styled from 'styled-components'

import type {Props as ConfigureApiProps} from './ConfigureApi'
import ConfigureApi from './ConfigureApi'

const SetupButtonContainer = styled.div`
  position: relative;
  display: block;
  font-size: 0.8em;
  transform: translate(0%, -10%);
`

export interface Props extends ConfigureApiProps {
  needsSetup: boolean
  isLoading: boolean | string
  showSetup: boolean
  onSetup: () => void
}
export default function SetupButton({
  onClose,
  onSave,
  onSetup,
  isLoading,
  showSetup,
  needsSetup,
  secrets,
}: Props) {
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
      {renderSetup && <ConfigureApi onClose={onClose} onSave={onSave} secrets={secrets} />}
    </SetupButtonContainer>
  )
}
