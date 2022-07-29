/* eslint-disable no-nested-ternary */
import {type CardTone, Box, Button, Card, Flex, Grid, Stack, Text} from '@sanity/ui'
import cx from 'classnames'
import React, {forwardRef, useCallback, useRef, useState} from 'react'
import {FiCopy, FiUpload} from 'react-icons/fi'
import styled, {keyframes} from 'styled-components'

import type {VideoAssetDocument} from '../util/types'
import EditThumbnailDialog from './EditThumbnailDialog'
import {type FileInputButtonProps, FileInputButton} from './FileInputButton'
import {withFocusRing} from './withFocusRing'

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
        {/* <ProgressBar
          percent={uploadProgress}
          text={text}
          isInProgress={uploadProgress === 100 && !error}
          showPercent
          animation
          color="primary"
        /> */}
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

const UploadCardWithFocusRing = withFocusRing(Card)

interface UploadCardProps {
  tone?: CardTone
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
    {children, tone, onPaste, onFocus, onBlur, onDrop, onDragEnter, onDragLeave, onDragOver},
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
      <UploadCardWithFocusRing
        tone={tone}
        height="fill"
        ref={forwardedRef}
        padding={0}
        radius={2}
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
      </UploadCardWithFocusRing>
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
