import {
  EditIcon,
  EllipsisVerticalIcon,
  PlugIcon,
  ResetIcon,
  SearchIcon,
  UploadIcon,
} from '@sanity/icons'
import {
  Box,
  Button,
  Inline,
  Label,
  Menu,
  MenuDivider,
  MenuItem,
  Popover,
  useClickOutside,
} from '@sanity/ui'
import React, {memo, useCallback, useEffect, useState} from 'react'
import {unstable_batchedUpdates} from 'react-dom'
import {PatchEvent, unset} from 'sanity/form'

import {type DialogState, type SetDialogState} from '../hooks/useDialogState'
import {type VideoInputProps} from '../types'
import {type FileInputButtonProps} from './FileInputButton'

export interface Props extends Pick<VideoInputProps, 'onChange'> {
  onEdit: () => void
  onBrowse: () => void
  // onSelect: FileInputButtonProps['onSelect']
  onConfigureApi: () => void
  readOnly: boolean
  dialogState: DialogState
  setDialogState: SetDialogState
}
function VideoActionsMenu(props: Props) {
  const {onEdit, readOnly, onBrowse, onConfigureApi, dialogState, setDialogState, onChange} = props
  const [open, setOpen] = useState(false)
  const [menuElement, setMenuRef] = useState<HTMLDivElement | null>(null)

  const onReset = useCallback(() => onChange(PatchEvent.from(unset(['asset']))), [onChange])
  const handleClick = useCallback(() => {
    unstable_batchedUpdates(() => {
      setDialogState(false)
      setOpen(true)
    })
  }, [setDialogState])

  useEffect(() => {
    if (open && dialogState) {
      setOpen(false)
    }
  }, [dialogState, open])

  useClickOutside(
    useCallback(() => setOpen(false), []),
    [menuElement]
  )

  return (
    <Inline space={1} padding={2}>
      <Button icon={EditIcon} mode="ghost" onClick={onEdit} />
      <Popover
        content={
          <Menu ref={setMenuRef}>
            <Box padding={2}>
              <Label muted size={1}>
                Replace
              </Label>
            </Box>
            <MenuItem icon={UploadIcon} text="Upload" />
            <MenuItem icon={SearchIcon} text="Browse" onClick={onBrowse} />
            <MenuDivider />
            <MenuItem icon={PlugIcon} text="Configure API" onClick={onConfigureApi} />
            <MenuDivider />
            <MenuItem
              tone="critical"
              icon={ResetIcon}
              text="Clear field"
              onClick={onReset}
              disabled={readOnly}
            />
          </Menu>
        }
        portal
        open={open}
      >
        <Button icon={EllipsisVerticalIcon} mode="ghost" onClick={handleClick} />
      </Popover>
    </Inline>
  )
}

export default memo(VideoActionsMenu)
