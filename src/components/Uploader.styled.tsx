/* eslint-disable no-nested-ternary */
import {Card, type CardTone} from '@sanity/ui'
import React, {forwardRef, useCallback, useRef} from 'react'
import {styled} from 'styled-components'

import {withFocusRing} from './withFocusRing'

const UploadCardWithFocusRing = withFocusRing(Card)

interface UploadCardProps {
  tone?: CardTone
  children: React.ReactNode
  onPaste: React.ClipboardEventHandler<HTMLInputElement>
  onDrop: React.DragEventHandler<HTMLDivElement>
  onDragOver: React.DragEventHandler<HTMLDivElement>
  onDragLeave: React.DragEventHandler<HTMLDivElement>
  onDragEnter: React.DragEventHandler<HTMLDivElement>
}
export const UploadCard = forwardRef<HTMLDivElement, UploadCardProps>(
  ({children, tone, onPaste, onDrop, onDragEnter, onDragLeave, onDragOver}, forwardedRef) => {
    const inputRef = useRef<HTMLInputElement>(null)
    const handleKeyDown = useCallback<React.KeyboardEventHandler<HTMLDivElement>>((event) => {
      const target = event.target as HTMLElement

      // Don't steal focus when pasting into the VTT input
      if (target.closest('#vtt-url')) {
        return
      }

      if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
        inputRef.current!.focus()
      }
    }, [])

    return (
      <UploadCardWithFocusRing
        tone={tone}
        ref={forwardedRef}
        padding={0}
        radius={2}
        shadow={0}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onPaste={onPaste}
        onDrop={onDrop}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
      >
        <HiddenInput ref={inputRef} />
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
