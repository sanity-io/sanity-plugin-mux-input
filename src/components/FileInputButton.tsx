import {Button, type ButtonProps} from '@sanity/ui'
import React, {useCallback, useId, useRef} from 'react'
import {styled} from 'styled-components'

const HiddenInput = styled.input`
  overflow: hidden;
  width: 0.1px;
  height: 0.1px;
  opacity: 0;
  position: absolute;
  z-index: -1;
`

const Label = styled.label`
  position: relative;
`

export interface FileInputButtonProps extends ButtonProps {
  onSelect: (files: FileList) => void
  accept?: string
}
export const FileInputButton = ({onSelect, accept, ...props}: FileInputButtonProps) => {
  const inputId = `FileSelect${useId()}`
  const inputRef = useRef<HTMLInputElement>(null)
  const handleSelect = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
    (event) => {
      if (onSelect) {
        onSelect(event.target.files!)
      }
    },
    [onSelect]
  )
  const handleButtonClick = useCallback(() => inputRef.current?.click(), [])
  return (
    <Label htmlFor={inputId}>
      <HiddenInput
        accept={accept || 'video/*'}
        ref={inputRef}
        tabIndex={0}
        type="file"
        id={inputId}
        onChange={handleSelect}
        value=""
      />
      <Button
        onClick={handleButtonClick}
        mode="default"
        tone="primary"
        style={{width: '100%'}}
        {...props}
      />
    </Label>
  )
}
