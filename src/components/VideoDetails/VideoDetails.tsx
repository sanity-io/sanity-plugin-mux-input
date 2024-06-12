import {
  CalendarIcon,
  CheckmarkIcon,
  ClockIcon,
  CropIcon,
  EditIcon,
  ErrorOutlineIcon,
  RevertIcon,
  SearchIcon,
  TagIcon,
  TrashIcon,
} from '@sanity/icons'
import {
  Button,
  Card,
  Dialog,
  Flex,
  Heading,
  Spinner,
  Stack,
  Tab,
  TabList,
  TabPanel,
  Text,
  TextInput,
} from '@sanity/ui'
import React, {useEffect, useState} from 'react'

import {DIALOGS_Z_INDEX} from '../../util/constants'
import FormField from '../FormField'
import IconInfo from '../IconInfo'
import {ResolutionIcon} from '../icons/Resolution'
import {StopWatchIcon} from '../icons/StopWatch'
import VideoPlayer from '../VideoPlayer'
import DeleteDialog from './DeleteDialog'
import useVideoDetails, {VideoDetailsProps} from './useVideoDetails'
import VideoReferences from './VideoReferences'

const AssetInput: React.FC<{
  label: string
  description?: string
  placeholder?: string
  value: string
  onInput: (e: React.FormEvent<HTMLInputElement>) => void
  disabled?: boolean
}> = (props) => (
  <FormField title={props.label} description={props.description} inputId={props.label}>
    <TextInput
      id={props.label}
      value={props.value}
      placeholder={props.placeholder}
      onInput={props.onInput}
      disabled={props.disabled}
    />
  </FormField>
)

const VideoDetails: React.FC<VideoDetailsProps> = (props) => {
  const [tab, setTab] = useState<'details' | 'references'>('details')
  const {
    displayInfo,
    filename,
    modified,
    references,
    referencesLoading,
    setFilename,
    state,
    setState,
    handleClose,
    confirmClose,
    saveChanges,
  } = useVideoDetails(props)

  const isSaving = state === 'saving'

  // Avoid layout shifts in large screens' 2-column dialog by setting their `minHeight` to the container's
  const [containerHeight, setContainerHeight] = useState<number | null>(null)
  const contentsRef = React.useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!contentsRef.current || !('getBoundingClientRect' in contentsRef.current)) return

    setContainerHeight(contentsRef.current.getBoundingClientRect().height)
  }, [])

  return (
    <Dialog
      animate
      header={displayInfo.title}
      zOffset={DIALOGS_Z_INDEX}
      id="video-details-dialog"
      onClose={handleClose}
      onClickOutside={handleClose}
      width={2}
      position="fixed"
      footer={
        <Card padding={3}>
          <Flex justify="space-between" align="center">
            <Button
              icon={TrashIcon}
              fontSize={2}
              padding={3}
              mode="bleed"
              text="Delete"
              tone="critical"
              onClick={() => setState('deleting')}
              disabled={isSaving}
            />
            {modified && (
              <Button
                icon={CheckmarkIcon}
                fontSize={2}
                padding={3}
                mode="ghost"
                text="Save and close"
                tone="positive"
                onClick={saveChanges}
                iconRight={isSaving && Spinner}
                disabled={isSaving}
              />
            )}
          </Flex>
        </Card>
      }
    >
      {/* DELETION DIALOG */}
      {state === 'deleting' && (
        <DeleteDialog
          asset={props.asset}
          cancelDelete={() => setState('idle')}
          placement={props.placement}
          referencesLoading={referencesLoading}
          references={references}
          succeededDeleting={() => {
            props.closeDialog()
          }}
        />
      )}

      {/* CONFIRM CLOSING DIALOG */}
      {state === 'closing' && (
        <Dialog
          animate
          header={'You have unsaved changes'}
          zOffset={DIALOGS_Z_INDEX}
          id="closing-video-details-dialog"
          onClose={() => confirmClose(false)}
          onClickOutside={() => confirmClose(false)}
          width={1}
          position="fixed"
          footer={
            <Card padding={3}>
              <Flex justify="space-between" align="center">
                <Button
                  icon={ErrorOutlineIcon}
                  fontSize={2}
                  padding={3}
                  text="Discard changes"
                  tone="critical"
                  onClick={() => confirmClose(true)}
                />
                {modified && (
                  <Button
                    icon={RevertIcon}
                    fontSize={2}
                    padding={3}
                    mode="ghost"
                    text="Keep editing"
                    tone="primary"
                    onClick={() => confirmClose(false)}
                  />
                )}
              </Flex>
            </Card>
          }
        >
          <Card padding={5}>
            <Stack style={{textAlign: 'center'}} space={3}>
              <Heading size={2}>Unsaved changes will be lost</Heading>
              <Text size={2}>Are you sure you want to discard them?</Text>
            </Stack>
          </Card>
        </Dialog>
      )}
      <Card
        padding={4}
        sizing="border"
        style={{
          containerType: 'inline-size',
        }}
      >
        <Flex
          sizing="border"
          gap={4}
          direction={['column', 'column', 'row']}
          align="flex-start"
          ref={contentsRef}
          style={
            typeof containerHeight === 'number'
              ? {
                  minHeight: containerHeight,
                }
              : undefined
          }
        >
          <Stack space={4} flex={1} sizing="border">
            <VideoPlayer asset={props.asset} autoPlay={props.asset.autoPlay || false} />
          </Stack>
          <Stack space={4} flex={1} sizing="border">
            <TabList space={2}>
              <Tab
                aria-controls="details-panel"
                icon={EditIcon}
                id="details-tab"
                label="Details"
                onClick={() => setTab('details')}
                selected={tab === 'details'}
              />
              <Tab
                aria-controls="references-panel"
                icon={SearchIcon}
                id="references-tab"
                label={`Used by ${references ? `(${references.length})` : ''}`}
                onClick={() => setTab('references')}
                selected={tab === 'references'}
              />
            </TabList>
            <TabPanel
              aria-labelledby="details-tab"
              id="details-panel"
              hidden={tab !== 'details'}
              style={{wordBreak: 'break-word'}}
            >
              <Stack space={4}>
                <AssetInput
                  label="Video title or file name"
                  description="Not visible to users. Useful for finding videos later."
                  value={filename || ''}
                  onInput={(e) => setFilename(e.currentTarget.value)}
                  disabled={state !== 'idle'}
                />
                <Stack space={3}>
                  {displayInfo?.duration && (
                    <IconInfo
                      text={`Duration: ${displayInfo.duration}`}
                      icon={ClockIcon}
                      size={2}
                    />
                  )}
                  {displayInfo?.max_stored_resolution && (
                    <IconInfo
                      text={`Max Resolution: ${displayInfo.max_stored_resolution}`}
                      icon={ResolutionIcon}
                      size={2}
                    />
                  )}
                  {displayInfo?.max_stored_frame_rate && (
                    <IconInfo
                      text={`Frame rate: ${displayInfo.max_stored_frame_rate}`}
                      icon={StopWatchIcon}
                      size={2}
                    />
                  )}
                  {displayInfo?.aspect_ratio && (
                    <IconInfo
                      text={`Aspect Ratio: ${displayInfo.aspect_ratio}`}
                      icon={CropIcon}
                      size={2}
                    />
                  )}
                  <IconInfo
                    text={`Uploaded on: ${displayInfo.createdAt.toLocaleDateString('en', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                    })}`}
                    icon={CalendarIcon}
                    size={2}
                  />
                  <IconInfo text={`Mux ID: \n${displayInfo.id}`} icon={TagIcon} size={2} />
                </Stack>
              </Stack>
            </TabPanel>
            <TabPanel
              aria-labelledby="references-tab"
              id="references-panel"
              hidden={tab !== 'references'}
            >
              <VideoReferences
                references={references}
                isLoaded={!referencesLoading}
                placement={props.placement}
              />
            </TabPanel>
          </Stack>
        </Flex>
      </Card>
    </Dialog>
  )
}

export default VideoDetails
