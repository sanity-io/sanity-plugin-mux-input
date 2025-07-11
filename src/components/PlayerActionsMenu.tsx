import {
  EllipsisHorizontalIcon,
  ImageIcon,
  LockIcon,
  PlugIcon,
  ResetIcon,
  SearchIcon,
  UploadIcon,
} from '@sanity/icons'
import {
  Box,
  Button,
  Card,
  Inline,
  Label,
  Menu,
  MenuDivider,
  MenuItem,
  Popover,
  Text,
  Tooltip,
  useClickOutsideEvent,
} from '@sanity/ui'
import {memo, useCallback, useEffect, useMemo, useState} from 'react'
import {PatchEvent, unset} from 'sanity'
import {styled} from 'styled-components'

import {type DialogState, type SetDialogState} from '../hooks/useDialogState'
import {getPlaybackPolicy} from '../util/getPlaybackPolicy'
import type {MuxInputProps, PluginConfig, VideoAssetDocument} from '../util/types'
import {FileInputMenuItem} from './FileInputMenuItem'
import {useAccessControl} from '../hooks/useAccessControl'

const LockCard = styled(Card)`
  position: absolute;
  top: 0;
  left: 0;
  opacity: 0.6;
  mix-blend-mode: screen;
  background: transparent;
`

const LockButton = styled(Button)`
  background: transparent;
  color: white;
`

// @TODO: add support for audio type (asset._type) when uploading an audio file so we can hide the thumbnail option.
const isVideoAsset = (asset: VideoAssetDocument) => {
  return asset._type === 'mux.videoAsset'
}

function PlayerActionsMenu(
  props: Pick<MuxInputProps, 'onChange' | 'readOnly'> & {
    asset: VideoAssetDocument
    onSelect: (files: File[]) => void
    dialogState: DialogState
    setDialogState: SetDialogState
    config: PluginConfig
  }
) {
  const {asset, readOnly, dialogState, setDialogState, onChange, onSelect} = props
  const [open, setOpen] = useState(false)
  const [menuElement, setMenuRef] = useState<HTMLDivElement | null>(null)
  const isSigned = useMemo(() => getPlaybackPolicy(asset) === 'signed', [asset])
  const {hasConfigAccess} = useAccessControl(props.config)

  const onReset = useCallback(() => onChange(PatchEvent.from(unset([]))), [onChange])

  useEffect(() => {
    if (open && dialogState) {
      setOpen(false)
    }
  }, [dialogState, open])

  useClickOutsideEvent(
    () => setOpen(false),
    () => [menuElement]
  )

  return (
    <Inline space={1} padding={2}>
      {isSigned && (
        <Tooltip
          animate
          content={
            <Box padding={2}>
              <Text muted size={1}>
                Signed playback policy
              </Text>
            </Box>
          }
          placement="right"
          portal
        >
          <LockCard radius={2} margin={2} scheme="dark" tone="positive">
            <LockButton icon={LockIcon} mode="bleed" tone="positive" />
          </LockCard>
        </Tooltip>
      )}
      <Popover
        animate
        content={
          <Menu ref={setMenuRef}>
            <Box padding={2}>
              <Label muted size={1}>
                Replace
              </Label>
            </Box>
            <FileInputMenuItem
              accept="video/*"
              icon={UploadIcon}
              onSelect={onSelect}
              text="Upload"
              disabled={readOnly}
              fontSize={1}
            />
            <MenuItem
              icon={SearchIcon}
              text="Browse"
              onClick={() => setDialogState('select-video')}
            />
            {isVideoAsset(asset) && (
              <MenuItem
                icon={ImageIcon}
                text="Thumbnail"
                onClick={() => setDialogState('edit-thumbnail')}
              />
            )}
            <MenuDivider />
            {hasConfigAccess && (
              <>
                <MenuItem
                  icon={PlugIcon}
                  text="Configure API"
                  onClick={() => setDialogState('secrets')}
                />
                <MenuDivider />
              </>
            )}
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
        <Button
          icon={EllipsisHorizontalIcon}
          mode="ghost"
          fontSize={1}
          onClick={() => {
            setDialogState(false)
            setOpen(true)
          }}
        />
      </Popover>
    </Inline>
  )
}

export default memo(PlayerActionsMenu)
