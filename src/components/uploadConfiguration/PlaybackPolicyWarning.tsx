import {WarningFilledIcon} from '@sanity/icons'
import {Box, Flex, Text} from '@sanity/ui'
import {CSSProperties} from 'react'

export default function PlaybackPolicyWarning() {
  const textStyle: CSSProperties = {
    color: 'black',
  }

  const boxStyle: CSSProperties = {
    outline: '0.01rem solid grey',
    backgroundColor: '#979cb0',
    borderRadius: '0.5rem',
    width: 'max-content',
  }

  return (
    <Box padding={1} style={boxStyle}>
      <Flex align="center" gap={2}>
        <WarningFilledIcon />
        <Text size={0} style={textStyle}>
          Please select at least one Playback Policy
        </Text>
      </Flex>
    </Box>
  )
}
