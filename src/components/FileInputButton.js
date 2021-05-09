import React from 'react'
import {uniqueId} from 'lodash'
import styled from 'styled-components'
import {Button} from '@sanity/ui'

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

const handleSelect = ({event, onSelect}) => {
  if (onSelect) {
    onSelect(event.target.files)
  }
}

const handleButtonClick = inputRef => {
  if (inputRef && inputRef.current) {
    inputRef.current.click()
  }
}

export const FileInputButton = ({onSelect, accept = 'video/*', type = 'file', ...props}) => {
  const _inputId = React.useRef(uniqueId('FileSelect'))
  const inputRef = React.useRef(null)
  return (
    <Label htmlFor={_inputId.current}>
      <HiddenInput
        ref={inputRef}
        accept={accept}
        tabindex="0"
        type={type}
        id={_inputId.current}
        onChange={event => handleSelect({event, onSelect})}
        value=""
      />
      <Button
        onClick={() => handleButtonClick(inputRef)}
        padding={[3, 3, 4]}
        mode="ghost"
        tone="default"
        style={{width: '100%'}}
        {...props}
      />
    </Label>
  )
}

export default FileInputButton
