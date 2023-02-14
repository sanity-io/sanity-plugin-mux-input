import {PlugIcon, SearchIcon, UploadIcon} from '@sanity/icons'
import {DocumentVideoIcon} from '@sanity/icons'
import {Box, Button, Card, Flex, Inline, Text} from '@sanity/ui'
import React, {useCallback} from 'react'
import styled from 'styled-components'

import type {SetDialogState} from '../hooks/useDialogState'
import {FileInputButton, type FileInputButtonProps} from './FileInputButton'

const UploadCard = styled(Card)`
  && {
    border-style: dashed;
  }
`

const ConfigureApiBox = styled(Box)`
  position: absolute;
  top: 0;
  right: 0;
`

interface UploadPlaceholderProps {
  setDialogState: SetDialogState
  readOnly: boolean
  hovering: boolean
  needsSetup: boolean
  onSelect: FileInputButtonProps['onSelect']
}
export default function UploadPlaceholder(props: UploadPlaceholderProps) {
  const {setDialogState, readOnly, onSelect, hovering, needsSetup} = props
  const handleBrowse = useCallback(() => setDialogState('select-video'), [setDialogState])
  const handleConfigureApi = useCallback(() => setDialogState('secrets'), [setDialogState])

  return (
    <Box style={{padding: 1, position: 'relative'}} height="stretch">
      <UploadCard
        sizing="border"
        height="fill"
        tone={readOnly ? 'transparent' : 'inherit'}
        border
        padding={3}
        style={hovering ? {borderColor: 'transparent'} : undefined}
      >
        <ConfigureApiBox padding={3}>
          <Button
            padding={3}
            radius={3}
            tone={needsSetup ? 'critical' : undefined}
            onClick={handleConfigureApi}
            icon={PlugIcon}
            mode="bleed"
          />
        </ConfigureApiBox>
        <Flex
          align="center"
          justify="space-between"
          gap={4}
          direction={['column', 'column', 'row']}
          paddingY={[2, 2, 0]}
          sizing="border"
          height="fill"
        >
          <Flex align="center" justify="center" gap={2} flex={1}>
            <Flex justify="center">
              <Text muted>
                <DocumentVideoIcon />
              </Text>
            </Flex>
            <Flex justify="center">
              <Text size={1} muted>
                Drag video or paste URL here
              </Text>
            </Flex>
          </Flex>
          <Inline space={2}>
            <FileInputButton
              mode="ghost"
              tone="default"
              icon={UploadIcon}
              text="Upload"
              onSelect={onSelect}
            />
            <Button mode="ghost" icon={SearchIcon} text="Select" onClick={handleBrowse} />
          </Inline>
        </Flex>
      </UploadCard>
    </Box>
  )
}
