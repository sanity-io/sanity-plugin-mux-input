import {Checkbox, Flex, Grid, Text} from '@sanity/ui'
import {ActionDispatch, CSSProperties, ReactNode, useState} from 'react'

import {UploadConfigurationStateAction} from '../UploadConfiguration'

export default function PlaybackPolicyOption({
  id,
  checked,
  optionName,
  description,
  dispatch,
  action,
  disabled,
}: {
  id: string
  checked: boolean
  optionName: string
  description: string | ReactNode
  dispatch: ActionDispatch<[action: UploadConfigurationStateAction]>
  action?: 'public_policy' | 'signed_policy' | 'drm_policy'
  disabled?: boolean
}) {
  const [scale, setScale] = useState(1)

  const boxStyle: CSSProperties = {
    outline: '0.01rem solid grey',
    transform: `scale(${scale})`,
    transition: 'transform 0.1s ease-in-out',
    cursor: disabled ? 'not-allowed' : 'pointer',
    borderRadius: '0.25rem',
  }

  const triggerAnimation = () => {
    setScale(0.98)
    setTimeout(() => {
      setScale(1)
    }, 100)
  }

  const handleBoxClick = () => {
    if (!action) return
    triggerAnimation()
    dispatch({
      action,
      value: !checked,
    })
  }

  const descriptionJsx =
    typeof description === 'string' ? (
      <Text size={2} muted>
        {description}
      </Text>
    ) : (
      description
    )
  return (
    <label>
      <Flex gap={3} padding={3} style={boxStyle}>
        <Checkbox
          id={id}
          required
          checked={checked}
          onChange={handleBoxClick}
          disabled={disabled}
        />
        <Grid gap={3}>
          <Text size={3} weight="bold">
            {optionName}
          </Text>
          {descriptionJsx}
        </Grid>
      </Flex>
    </label>
  )
}
