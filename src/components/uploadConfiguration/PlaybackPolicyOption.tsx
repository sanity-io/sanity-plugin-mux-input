import {Box, Checkbox, Flex, Stack, Text} from '@sanity/ui'
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
    <Box padding={3} style={boxStyle} onClick={handleBoxClick}>
      <Stack space={2}>
        <Flex align="center" gap={2}>
          <Checkbox id={id} required checked={checked} onChange={() => {}} />
          <Text weight="bold" size={2}>
            {optionName}
          </Text>
        </Flex>

        <Text muted size={1}>
          {description}
        </Text>
      </Stack>
    </Box>
  )
}
