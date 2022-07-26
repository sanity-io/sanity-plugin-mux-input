import {Button} from '@sanity/ui'
import SetupIcon from 'part:@sanity/base/plugin-icon'
import React from 'react'

import styles from './Input.css'
import type {Props as SetupProps} from './Setup'
import SetupDialog from './SetupDialog'

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
  const renderSetup = !isLoading && showSetup
  return (
    <div className={styles.setupButtonContainer}>
      <Button
        tone={needsSetup ? 'critical' : 'positive'}
        mode="bleed"
        onClick={onSetup}
        icon={SetupIcon}
        padding={3}
        radius={3}
        aria-label="Set up Mux credentials"
      />
      {renderSetup && <SetupDialog secrets={secrets} onCancel={onCancel} onSave={onSave} />}
    </div>
  )
}
