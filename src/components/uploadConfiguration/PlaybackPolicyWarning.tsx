import {WarningFilledIcon} from '@sanity/icons'
import {Box, Flex, Text} from '@sanity/ui'
import {CSSProperties} from 'react'

export default function PlaybackPolicyWarning() {
  const textStyle: CSSProperties = {
    color: '#13141A',
    fontWeight: 500,
  }

  const boxStyle: CSSProperties = {
    outline: '0.01rem solid grey',
    backgroundColor: '#979cb0',
    borderRadius: '0.5rem',
    width: 'max-content',
    color: '#13141A',
  }

  return (
    <Box padding={2} style={boxStyle}>
      <Flex align="center" gap={2}>
        <WarningFilledIcon />
        <Text size={1} style={textStyle}>
          Please select at least one Playback Policy
        </Text>
      </Flex>
    </Box>
  )
}
