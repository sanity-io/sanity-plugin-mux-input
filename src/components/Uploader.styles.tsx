/* eslint-disable no-nested-ternary */
import {useId} from '@reach/auto-id'
import {Box, Button, Card, Dialog, Flex, Grid, Stack, Text} from '@sanity/ui'
import cx from 'classnames'
import ProgressBar from 'part:@sanity/components/progress/bar'
import React, {forwardRef, useCallback, useRef} from 'react'
import {FiCopy, FiUpload} from 'react-icons/fi'
import styled, {keyframes} from 'styled-components'

import {FileInputButton, FileInputButtonProps} from './FileInputButton'

interface ErrorDialogProps {
  message: string
  onClose: () => void
  onSetup: () => void
}
export const ErrorDialog = ({message, onClose, onSetup}: ErrorDialogProps) => {
  const id = `ErrorDialog${useId()}`
  if (message === 'Invalid credentials') {
    return (
      <Dialog id={id} header="Invalid credentials" onClose={onClose}>
        <Box padding={4}>
          <Stack space={4}>
            <Text>You need to check your Mux access token and secret key.</Text>
            <Button text="Run setup" tone="primary" padding={3} onClick={onSetup} />
          </Stack>
        </Box>
      </Dialog>
    )
  }
  return (
    <Dialog id={id} header="Upload failed" onClose={onClose}>
      <Box padding={4}>
        <Text>{message}</Text>
      </Box>
    </Dialog>
  )
}

interface UploadProgressProps {
  progress: number
  error?: Error | null
  fileInfo?: {name?: string} | null
  url?: string | null
  onCancel: React.MouseEventHandler<HTMLButtonElement>
}
export const UploadProgress = ({
  progress: uploadProgress,
  fileInfo,
  url,
  error,
  onCancel,
}: UploadProgressProps) => {
  let text =
    uploadProgress < 100
      ? `Uploading ${fileInfo ? `'${fileInfo.name}'` : 'file'}`
      : 'Waiting for Mux to complete the file'
  if (error) {
    text = error.message
  }
  if (url) {
    text = `Uploading ${url}`
  }
  return (
    <UploadProgressCard>
      <UploadProgressStack space={5}>
        <ProgressBar
          percent={uploadProgress}
          text={text}
          isInProgress={uploadProgress === 100 && !error}
          showPercent
          animation
          color="primary"
        />
        {(uploadProgress < 100 || error) && (
          <UploadCancelButton text="Cancel upload" onClick={onCancel} />
        )}
      </UploadProgressStack>
    </UploadProgressCard>
  )
}
export const UploadProgressCard = styled(Card).attrs({padding: 4})`
  box-sizing: border-box;
`
export const UploadCancelButton = styled(Button).attrs({padding: 3, tone: 'critical'})`
  justify-self: center;
`
export const UploadProgressStack = styled(Stack).attrs({space: 5})`
  text-align: left;
`

const ctrlKey = 17
const cmdKey = 91

interface UploadCardProps {
  children: React.ReactNode
  onPaste: React.ClipboardEventHandler<HTMLInputElement>
  onFocus: React.FocusEventHandler<HTMLDivElement>
  onBlur: React.FocusEventHandler<HTMLDivElement>
  onDrop: React.DragEventHandler<HTMLDivElement>
  onDragOver: React.DragEventHandler<HTMLDivElement>
  onDragLeave: React.DragEventHandler<HTMLDivElement>
  onDragEnter: React.DragEventHandler<HTMLDivElement>
}
export const UploadCard = forwardRef<HTMLDivElement, UploadCardProps>(
  (
    {children, onPaste, onFocus, onBlur, onDrop, onDragEnter, onDragLeave, onDragOver},
    forwardedRef
  ) => {
    const ctrlDown = useRef(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const handleKeyDown = useCallback<React.KeyboardEventHandler<HTMLDivElement>>((event) => {
      if (event.keyCode == ctrlKey || event.keyCode == cmdKey) {
        ctrlDown.current = true
      }
      const vKey = 86
      if (ctrlDown.current && event.keyCode == vKey) {
        inputRef.current!.focus()
      }
    }, [])
    const handleKeyUp = useCallback<React.KeyboardEventHandler<HTMLDivElement>>((event) => {
      if (event.keyCode == ctrlKey || event.keyCode == cmdKey) {
        ctrlDown.current = false
      }
    }, [])

    return (
      <Card
        ref={forwardedRef}
        padding={0}
        radius={0}
        shadow={0}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onPaste={onPaste}
        onFocus={onFocus}
        onBlur={onBlur}
        onDrop={onDrop}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
      >
        <HiddenInput ref={inputRef} onPaste={onPaste} />
        {children}
      </Card>
    )
  }
)

const HiddenInput = styled.input.attrs({type: 'text'})`
  position: absolute;
  border: 0;
  color: white;
  opacity: 0;

  &:focus {
    outline: none;
  }
`

interface UploadPlaceholderProps {
  onUpload: (files: FileList) => void
  onBrowse: () => void
  invalidPaste: boolean
  invalidFile: boolean
  hasFocus: boolean
  isDraggingOver: boolean
}
export const UploadPlaceholder = ({
  onUpload,
  onBrowse,
  invalidPaste,
  invalidFile,
  hasFocus,
  isDraggingOver,
}: UploadPlaceholderProps) => {
  return (
    <UploaderCard
      className={cx({
        'is-invalid-file': invalidFile,
        'is-invalid-paste': invalidPaste,
        'has-focus': hasFocus,
      })}
    >
      <Flex justify="center" align="center" padding={3}>
        <UploaderCardDrop
          display={['none', 'block']}
          radius={2}
          padding={4}
          tone={invalidFile ? 'critical' : isDraggingOver ? 'positive' : undefined}
        >
          <Flex align="center" justify="center" padding={4}>
            <Text>
              <FiUpload size="1.25em" />
            </Text>
          </Flex>
          <Text weight="medium">Drop file</Text>
        </UploaderCardDrop>
        <UploaderCardPaste
          display={['none', 'block']}
          radius={2}
          padding={4}
          tone={invalidPaste ? 'critical' : undefined}
        >
          <Flex align="center" justify="center" padding={4}>
            <Text>
              <FiCopy size="1.25em" />
            </Text>
          </Flex>
          <Text weight="medium">Paste URL</Text>
        </UploaderCardPaste>
      </Flex>
      <Grid columns={2} gap={2}>
        <UploadButton onSelect={onUpload} />
        <Button mode="ghost" tone="default" text="Browse" onClick={onBrowse} />
      </Grid>
    </UploaderCard>
  )
}
const shake = keyframes`
10%,
  90% {
    transform: translate3d(-1px, 0, 0);
  }

  20%,
  80% {
    transform: translate3d(2px, 0, 0);
  }

  30%,
  50%,
  70% {
    transform: translate3d(-4px, 0, 0);
  }

  40%,
  60% {
    transform: translate3d(4px, 0, 0);
  }
`
const UploaderCardDrop = styled(Card)``
const UploaderCardPaste = styled(Card)`
  opacity: 0.2;
  transition: opacity linear 0.2s;
`
const UploaderCard = styled(Card)`
  &.is-invalid-file ${UploaderCardDrop}, &.is-invalid-paste ${UploaderCardPaste} {
    animation: ${shake} 0.82s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
    transform: translate3d(0, 0, 0);
    backface-visibility: hidden;
    perspective: 1000px;
  }
  &.has-focus ${UploaderCardPaste} {
    opacity: 1;
  }
`

interface UploadButtonProps extends Pick<FileInputButtonProps, 'onSelect'> {}
export const UploadButton = ({onSelect}: UploadButtonProps) => {
  return (
    <FileInputButton
      icon={<FiUpload data-sanity-icon="upload" />}
      onSelect={onSelect}
      text="Upload"
    />
  )
}

interface UploadButtonGridProps {
  onUpload: FileInputButtonProps['onSelect']
  onBrowse: () => void
  onThumbnail: () => void
  onRemove: () => void
  videoReadyToPlay: boolean
}
export const UploadButtonGrid = ({
  onBrowse,
  videoReadyToPlay,
  onThumbnail,
  onRemove,
  onUpload,
}: UploadButtonGridProps) => {
  return (
    <Grid columns={4} gap={2}>
      <UploadButton onSelect={onUpload} />
      <Button key="browse" mode="ghost" tone="primary" onClick={onBrowse} text="Browse" />
      <Button
        key="thumbnail"
        mode="ghost"
        tone="primary"
        disabled={videoReadyToPlay === false}
        onClick={onThumbnail}
        text="Thumbnail"
      />
      <Button key="remove" onClick={onRemove} mode="ghost" tone="critical" text="Remove" />
    </Grid>
  )
}
