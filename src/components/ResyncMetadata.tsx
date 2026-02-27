import {CheckmarkCircleIcon, ErrorOutlineIcon, SyncIcon} from '@sanity/icons'
import {Box, Button, Card, Dialog, Flex, Heading, Radio, Spinner, Stack, Text} from '@sanity/ui'
import {useState} from 'react'

import useResyncMuxMetadata from '../hooks/useResyncMuxMetadata'
import {isEmptyOrPlaceholderTitle} from '../util/assetTitlePlaceholder'
import {DIALOGS_Z_INDEX} from '../util/constants'

type SyncOption = 'fillEmpty' | 'syncTitles' | 'fullResync'

interface OptionCardProps {
  id: SyncOption
  selected: boolean
  onSelect: (id: SyncOption) => void
  title: string
  count: number
  description: string
  disabled?: boolean
}

function OptionCard({
  id,
  selected,
  onSelect,
  title,
  count,
  description,
  disabled,
}: OptionCardProps) {
  return (
    <Card
      as="label"
      padding={3}
      radius={2}
      border
      tone={selected ? 'primary' : 'default'}
      style={{
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Flex gap={3} align="flex-start">
        <Box paddingTop={1}>
          <Radio
            checked={selected}
            onChange={() => onSelect(id)}
            disabled={disabled}
            name="sync-option"
          />
        </Box>
        <Stack space={2} flex={1}>
          <Flex align="center" gap={2}>
            <Text size={2} weight="semibold">
              {title} ({count})
            </Text>
          </Flex>
          <Text size={1} muted>
            {description}
          </Text>
        </Stack>
      </Flex>
    </Card>
  )
}

function ResyncMetadataDialog(props: ReturnType<typeof useResyncMuxMetadata>) {
  const {resyncState} = props

  const videosToUpdate = props.matchedAssets?.filter((m) => m.muxAsset).length || 0
  const videosWithEmptyOrPlaceholder =
    props.matchedAssets?.filter(
      (m) => m.muxAsset && m.muxTitle && isEmptyOrPlaceholderTitle(m.currentTitle, m.muxAsset.id)
    ).length || 0

  const hasEmptyTitles = videosWithEmptyOrPlaceholder > 0
  const defaultOption: SyncOption = hasEmptyTitles ? 'fillEmpty' : 'syncTitles'
  const [selectedOption, setSelectedOption] = useState<SyncOption>(defaultOption)

  const canTriggerResync = resyncState === 'idle' || resyncState === 'error'
  const isResyncing = resyncState === 'syncing'
  const isDone = resyncState === 'done'
  const isLoading = props.muxAssets.loading || props.sanityAssetsLoading

  const handleSync = () => {
    switch (selectedOption) {
      case 'fillEmpty':
        props.syncOnlyEmpty()
        break
      case 'syncTitles':
        props.syncAllVideos()
        break
      case 'fullResync':
        props.syncFullData()
        break
      default:
        break
    }
  }

  return (
    <Dialog
      animate
      header="Sync with Mux"
      zOffset={DIALOGS_Z_INDEX}
      id="resync-metadata-dialog"
      onClose={props.closeDialog}
      onClickOutside={props.closeDialog}
      width={1}
      position="fixed"
      footer={
        !isDone && (
          <Card padding={3}>
            <Flex justify="flex-end" gap={2}>
              <Button
                fontSize={2}
                padding={3}
                mode="ghost"
                text="Cancel"
                onClick={props.closeDialog}
                disabled={isResyncing}
              />
              <Button
                icon={SyncIcon}
                fontSize={2}
                padding={3}
                text="Run sync"
                tone="primary"
                onClick={handleSync}
                iconRight={isResyncing && Spinner}
                disabled={!canTriggerResync || isLoading}
              />
            </Flex>
          </Card>
        )
      }
    >
      <Box padding={4}>
        {/* LOADING ASSETS STATE */}
        {isLoading && (
          <Card tone="primary" marginBottom={4} padding={3} border radius={2}>
            <Flex align="center" gap={4}>
              <Spinner muted size={4} />
              <Stack space={2}>
                <Text size={2} weight="semibold">
                  Loading assets from Mux
                </Text>
                <Text size={1} muted>
                  This may take a while.
                </Text>
              </Stack>
            </Flex>
          </Card>
        )}

        {/* ERROR LOADING MUX */}
        {props.muxAssets.error && (
          <Card tone="critical" marginBottom={4} padding={3} border radius={2}>
            <Flex align="center" gap={2}>
              <ErrorOutlineIcon fontSize={36} />
              <Stack space={2}>
                <Text size={2} weight="semibold">
                  There was an error getting data from Mux
                </Text>
                <Text size={1}>Please try again or contact a developer for help.</Text>
              </Stack>
            </Flex>
          </Card>
        )}

        {/* SYNCING STATE */}
        {resyncState === 'syncing' && (
          <Card tone="primary" marginBottom={4} padding={3} border radius={2}>
            <Flex align="center" gap={4}>
              <Spinner muted size={4} />
              <Stack space={2}>
                <Text size={2} weight="semibold">
                  Syncing metadata
                </Text>
                <Text size={1} muted>
                  Updating videos from Mux...
                </Text>
              </Stack>
            </Flex>
          </Card>
        )}

        {/* ERROR SYNCING */}
        {resyncState === 'error' && (
          <Card tone="critical" marginBottom={4} padding={3} border radius={2}>
            <Flex align="center" gap={2}>
              <ErrorOutlineIcon fontSize={36} />
              <Stack space={2}>
                <Text size={2} weight="semibold">
                  There was an error syncing metadata
                </Text>
                <Text size={1}>
                  {props.resyncError
                    ? `Error: ${props.resyncError}`
                    : 'Please try again or contact a developer for help.'}
                </Text>
              </Stack>
            </Flex>
          </Card>
        )}

        {/* SUCCESS STATE */}
        {resyncState === 'done' && (
          <Stack paddingY={5} space={3} style={{textAlign: 'center'}}>
            <Box>
              <CheckmarkCircleIcon fontSize={48} />
            </Box>
            <Heading size={2}>Sync completed</Heading>
            <Text size={2} muted>
              Videos have been updated from Mux.
            </Text>
          </Stack>
        )}

        {/* OPTIONS */}
        {!isDone && !isLoading && !props.muxAssets.error && (
          <Stack space={4}>
            <Text size={1} muted>
              Found {videosToUpdate} video{videosToUpdate === 1 ? '' : 's'} linked to Mux.
            </Text>

            <Stack space={3}>
              {hasEmptyTitles && (
                <OptionCard
                  id="fillEmpty"
                  selected={selectedOption === 'fillEmpty'}
                  onSelect={setSelectedOption}
                  title="Fill missing titles only"
                  count={videosWithEmptyOrPlaceholder}
                  description="Updates only videos without a title or with placeholder titles (e.g., 'Asset #123') using the title from Mux."
                  disabled={isResyncing}
                />
              )}

              <OptionCard
                id="syncTitles"
                selected={selectedOption === 'syncTitles'}
                onSelect={setSelectedOption}
                title="Sync all titles"
                count={videosToUpdate}
                description="Replaces the title in Sanity with the title from Mux for all videos."
                disabled={isResyncing}
              />

              <OptionCard
                id="fullResync"
                selected={selectedOption === 'fullResync'}
                onSelect={setSelectedOption}
                title="Full resync"
                count={videosToUpdate}
                description="Updates all fields from Mux including status, duration, tracks, captions, and renditions."
                disabled={isResyncing}
              />
            </Stack>
          </Stack>
        )}
      </Box>
    </Dialog>
  )
}

export default function ResyncMetadata() {
  const resyncMetadata = useResyncMuxMetadata()

  if (!resyncMetadata.hasSecrets) {
    return
  }

  if (resyncMetadata.dialogOpen) {
    // eslint-disable-next-line consistent-return
    return <ResyncMetadataDialog {...resyncMetadata} />
  }

  // eslint-disable-next-line consistent-return
  return <Button mode="bleed" text="Sync with Mux" onClick={resyncMetadata.openDialog} />
}
