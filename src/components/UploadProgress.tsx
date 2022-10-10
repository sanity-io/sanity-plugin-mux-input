// Lifted from sanity/form/inputs/files/common/UploadProgress

import {Button, Card, Code, Flex, Inline, Stack, Text} from '@sanity/ui'
import React from 'react'
import {LinearProgress} from 'sanity'
import styled from 'styled-components'

export const CardWrapper = styled(Card)`
  min-height: 82px;
  box-sizing: border-box;
`

export const FlexWrapper = styled(Flex)`
  text-overflow: ellipsis;
  overflow: hidden;
`

export const LeftSection = styled(Stack)`
  position: relative;
  width: 60%;
`

export const CodeWrapper = styled(Code)`
  position: relative;
  width: 100%;

  code {
    overflow: hidden;
    text-overflow: ellipsis;
    position: relative;
    max-width: 200px;
  }
`

export const UploadProgress = ({
  progress = 100,
  onCancel,
  filename,
  text = 'Uploading',
}: {
  progress: number
  filename?: React.ReactNode
  onCancel?: React.MouseEventHandler<HTMLButtonElement>
  text?: React.ReactNode
}) => {
  return (
    <CardWrapper tone="primary" padding={4} border height="fill">
      <FlexWrapper align="center" justify="space-between" height="fill" direction="row" gap={2}>
        <LeftSection>
          <Flex justify="center" gap={[3, 3, 2, 2]} direction={['column', 'column', 'row']}>
            <Text size={1}>
              <Inline space={2}>
                {text}
                <CodeWrapper size={1}>{filename ? filename : '...'}</CodeWrapper>
              </Inline>
            </Text>
          </Flex>

          <Card marginTop={3} radius={5} shadow={1}>
            <LinearProgress value={progress} />
          </Card>
        </LeftSection>

        {onCancel ? (
          <Button
            fontSize={2}
            text="Cancel upload"
            mode="ghost"
            tone="critical"
            onClick={onCancel}
          />
        ) : null}
      </FlexWrapper>
    </CardWrapper>
  )
}
