import {Box, Card, Flex, Spinner, Text} from '@sanity/ui'
import React from 'react'
import styled from 'styled-components'

// This container base container ensures everything uses the same aspect ratio, avoids layout shifts and stuff jumping around
export const AspectRatioCard = styled(Card)`
  aspect-ratio: 16 / 9;
  position: relative;
  width: 100%;
`

export const InputFallback = () => {
  return (
    <div style={{padding: 1}}>
      <Card
        shadow={1}
        sizing="border"
        style={{aspectRatio: '16/9', width: '100%', borderRadius: '1px'}}
      >
        <Flex align="center" direction="column" height="fill" justify="center">
          <Spinner muted />
          <Box marginTop={3}>
            <Text align="center" muted size={1}>
              Loading…
            </Text>
          </Box>
        </Flex>
      </Card>
    </div>
  )
}
