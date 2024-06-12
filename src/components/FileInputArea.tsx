import {UploadIcon} from '@sanity/icons'
import {Box, Button, Card, CardTone, Flex, Inline, Text} from '@sanity/ui'
import {PropsWithChildren, useRef, useState} from 'react'

import {extractDroppedFiles} from '../util/extractFiles'
import {FileInputButton} from './FileInputButton'

interface FileInputAreaProps extends PropsWithChildren {
  accept?: string
  acceptMIMETypes?: string[]
  label: React.ReactNode
  onSelect: (files: FileList | File[]) => void
}

export default function FileInputArea({
  label,
  accept,
  acceptMIMETypes,
  onSelect,
}: FileInputAreaProps) {
  const dragEnteredEls = useRef<EventTarget[]>([])
  const [dragState, setDragState] = useState<'valid' | 'invalid' | null>(null)

  // Stages and validates an upload from dragging+dropping files or folders
  const handleDrop: React.DragEventHandler<HTMLDivElement> = (event) => {
    setDragState(null)
    event.preventDefault()
    event.stopPropagation()
    extractDroppedFiles(event.nativeEvent.dataTransfer!).then(onSelect)
  }

  /* ------------------------------- Drag State ------------------------------- */

  const handleDragOver: React.DragEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault()
    event.stopPropagation()
  }

  const handleDragEnter: React.DragEventHandler<HTMLDivElement> = (event) => {
    event.stopPropagation()
    dragEnteredEls.current.push(event.target)
    const type = event.dataTransfer.items?.[0]?.type
    setDragState(
      !acceptMIMETypes || acceptMIMETypes.some((mimeType) => type?.match(mimeType))
        ? 'valid'
        : 'invalid'
    )
  }

  const handleDragLeave: React.DragEventHandler<HTMLDivElement> = (event) => {
    event.stopPropagation()
    const idx = dragEnteredEls.current.indexOf(event.target)
    if (idx > -1) {
      dragEnteredEls.current.splice(idx, 1)
    }
    if (dragEnteredEls.current.length === 0) {
      setDragState(null)
    }
  }

  let tone: CardTone = 'inherit'
  if (dragState) tone = dragState === 'valid' ? 'positive' : 'critical'
  return (
    <Card border sizing="border" tone={tone} style={{borderStyle: 'dashed'}} padding={3}>
      <Flex
        align="center"
        justify="space-between"
        gap={4}
        direction={['column', 'column', 'row']}
        paddingY={[2, 2, 0]}
        sizing="border"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDragEnter={handleDragEnter}
      >
        <Flex align="center" justify="center" gap={2} flex={1}>
          {label}
        </Flex>
        <Inline space={2}>
          <FileInputButton
            mode="ghost"
            tone="default"
            icon={UploadIcon}
            text="Upload"
            onSelect={onSelect}
            accept={accept}
          />
        </Inline>
      </Flex>
    </Card>
  )
}
