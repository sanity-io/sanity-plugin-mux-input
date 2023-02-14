/* eslint-disable no-nested-ternary */
import {Card, type CardTone} from '@sanity/ui'
import React, {forwardRef, useCallback, useRef} from 'react'
import styled from 'styled-components'

import {withFocusRing} from './withFocusRing'

const ctrlKey = 17
const cmdKey = 91

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
