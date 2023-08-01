import {
  CalendarIcon,
  CheckmarkIcon,
  ClockIcon,
  CropIcon,
  EditIcon,
  ErrorOutlineIcon,
  RevertIcon,
  SearchIcon,
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
import React, {useState} from 'react'

import FormField from '../FormField'
import IconInfo from '../IconInfo'
import {ResolutionIcon} from '../icons/Resolution'
import {StopWatchIcon} from '../icons/StopWatch'
import SpinnerBox from '../SpinnerBox'
import VideoPlayer from '../VideoPlayer'
import useFileDetails, {FileDetailsProps} from './useVideoDetails'
import FileReferences from './VideoReferences'

const AssetInput: React.FC<{
  label: string
  description?: string
  placeholder?: string
  value: string
  onInput: (e: React.FormEvent<HTMLInputElement>) => void
}> = (props) => (
  <FormField title={props.label} description={props.description} inputId={props.label}>
    <TextInput
      id={props.label}
      value={props.value}
      placeholder={props.placeholder}
      onInput={props.onInput}
    />
  </FormField>
)

const Z_INDEX = 60_000

const VideoDetails: React.FC<FileDetailsProps> = (props) => {
  const [tab, setTab] = useState<'details' | 'references'>('details')
  const {
    displayInfo,
    filename,
    modified,
    references,
    referencesLoading,
    send,
    setFilename,
    stateMatches,
  } = useFileDetails(props)

  const isSaving = false

  return (
    <Dialog
      header={displayInfo.title}
      zOffset={Z_INDEX}
      id="file-details-dialog"
      onClose={() => send('CLOSE')}
      onClickOutside={() => send('CLOSE')}
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
              onClick={() => send('DELETE')}
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
                onClick={() => send('SAVE')}
                iconRight={isSaving && Spinner}
                disabled={isSaving}
              />
            )}
          </Flex>
        </Card>
      }
    >
      {/* DELETION DIALOG */}
      {stateMatches('interactions.deleting') && (
        <Dialog
          header={'Delete file'}
          zOffset={Z_INDEX}
          id="deleting-file-details-dialog"
          onClose={() => send('CANCEL')}
          onClickOutside={() => send('CANCEL')}
          width={0}
          position="fixed"
          footer={
            <Card padding={3}>
              <Flex justify="space-between" align="center">
                <Button
                  icon={TrashIcon}
                  fontSize={2}
                  padding={3}
                  text="Delete file"
                  tone="critical"
                  onClick={() => send('CONFIRM')}
                  disabled={[
                    'interactions.deleting.processing_deletion',
                    'interactions.deleting.checkingReferences',
                    'interactions.deleting.cantDelete',
                  ].some(stateMatches)}
                />
              </Flex>
            </Card>
          }
        >
          <Card
            padding={5}
            style={{
              minHeight: '150px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Stack space={3}>
              {stateMatches('interactions.deleting.checkingReferences') && (
                <>
                  <Heading size={2}>Checking if file can be deleted</Heading>
                  <SpinnerBox />
                </>
              )}
              {stateMatches('interactions.deleting.cantDelete') && (
                <>
                  <Heading size={2}>Video can't be deleted</Heading>
                  <Text size={2} style={{marginBottom: '2rem'}}>
                    There are {references?.length} documents pointing to this file. Remove their
                    references to this file or delete them before proceeding.
                  </Text>
                  <FileReferences
                    references={references}
                    isLoaded={!referencesLoading}
                    placement={props.placement}
                  />
                </>
              )}
              {stateMatches('interactions.deleting.confirm') && (
                <>
                  <Heading size={2}>Are you sure you want to delete this file?</Heading>
                  <Text size={2}>This action is irreversible</Text>
                </>
              )}
              {stateMatches('interactions.deleting.processing_deletion') && (
                <>
                  <Heading size={2}>Deleting file...</Heading>
                  <SpinnerBox />
                </>
              )}
              {stateMatches('interactions.deleting.error_deleting') && (
                <>
                  <Heading size={2}>Something went wrong!</Heading>
                  <Text size={2}>Try deleting the file again by clicking the button below</Text>
                </>
              )}
            </Stack>
          </Card>
        </Dialog>
      )}

      {/* CONFIRM CLOSING DIALOG */}
      {stateMatches('interactions.closing.confirm') && (
        <Dialog
          header={'You have unsaved changes'}
          zOffset={Z_INDEX}
          id="closing-file-details-dialog"
          onClose={() => send('CANCEL')}
          onClickOutside={() => send('CANCEL')}
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
                  onClick={() => send('CONFIRM')}
                />
                {modified && (
                  <Button
                    icon={RevertIcon}
                    fontSize={2}
                    padding={3}
                    mode="ghost"
                    text="Keep editing"
                    tone="primary"
                    onClick={() => send('CANCEL')}
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
          align={['flex-start', 'flex-start', 'center']}
          direction={['column', 'column', 'row']}
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
                label="Used by"
                onClick={() => setTab('references')}
                selected={tab === 'references'}
              />
            </TabList>
            <TabPanel aria-labelledby="details-tab" id="details-panel" hidden={tab !== 'details'}>
              <Stack space={4}>
                <AssetInput
                  label="File name"
                  description="Not visible to users. Useful for finding files later."
                  value={filename || ''}
                  onInput={(e) => setFilename(e.currentTarget.value)}
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
                </Stack>
              </Stack>
            </TabPanel>
            <TabPanel
              aria-labelledby="references-tab"
              id="references-panel"
              hidden={tab !== 'references'}
            >
              <FileReferences
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
