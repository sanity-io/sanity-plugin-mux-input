import {Box, Checkbox, Flex, Grid, Stack, Text} from '@sanity/ui'
import {CSSProperties, useState} from 'react'

import {UploadConfigurationStateAction} from '../UploadConfiguration'

export default function PlaybackPolicyOption({
  id,
  checked,
  optionName,
  description,
  dispatch,
  action,
}: {
  id: string
  checked: boolean
  optionName: string
  description: string
  dispatch: any
  action: UploadConfigurationStateAction['action']
}) {
  const [scale, setScale] = useState(1)

  const boxStyle: CSSProperties = {
    outline: '0.01rem solid grey',
    transform: `scale(${scale})`,
    transition: 'transform 0.1s ease-in-out',
    cursor: 'pointer',
    borderRadius: '0.25rem',
  }

  const triggerAnimation = () => {
    setScale(0.98)
    setTimeout(() => {
      setScale(1)
    }, 100)
  }

  const handleBoxClick = () => {
    triggerAnimation()
    dispatch({
      action,
      value: !checked,
    })
  }
  return (
    <label>
      <Flex gap={3} padding={3} style={boxStyle}>
        <Checkbox id={id} required checked={checked} onChange={handleBoxClick} />
        <Grid gap={3}>
          <Text size={3} weight="bold">
            {optionName}
          </Text>
          <Text size={2} muted>
            {description}
          </Text>
        </Grid>
      </Flex>
    </label>
  )
}
