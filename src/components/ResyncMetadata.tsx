import {CheckmarkCircleIcon, ErrorOutlineIcon, SyncIcon} from '@sanity/icons'
import {Box, Button, Card, Dialog, Flex, Heading, Spinner, Stack, Text} from '@sanity/ui'

import useResyncMuxMetadata from '../hooks/useResyncMuxMetadata'
import {isEmptyOrPlaceholderTitle} from '../util/assetTitlePlaceholder'
import {DIALOGS_Z_INDEX} from '../util/constants'

// eslint-disable-next-line complexity
function ResyncMetadataDialog(props: ReturnType<typeof useResyncMuxMetadata>) {
  const {resyncState} = props

  const canTriggerResync = resyncState === 'idle' || resyncState === 'error'
  const isResyncing = resyncState === 'syncing'
  const isDone = resyncState === 'done'

  const videosToUpdate = props.matchedAssets?.filter((m) => m.muxAsset).length || 0
  const videosWithEmptyOrPlaceholder =
    props.matchedAssets?.filter(
      (m) => m.muxAsset && m.muxTitle && isEmptyOrPlaceholderTitle(m.currentTitle, m.muxAsset.id)
    ).length || 0

  return (
    <Dialog
      animate
      header={'Resync Metadata from Mux'}
      zOffset={DIALOGS_Z_INDEX}
      id="resync-metadata-dialog"
      onClose={props.closeDialog}
      onClickOutside={props.closeDialog}
      width={1}
      position="fixed"
      footer={
        !isDone && (
          <Card padding={3}>
            <Flex justify="space-between" align="center">
              <Button
                fontSize={2}
                padding={3}
                mode="ghost"
                text="Cancel"
                tone="critical"
                onClick={props.closeDialog}
                disabled={isResyncing}
              />
              <Flex gap={2}>
                {videosWithEmptyOrPlaceholder > 0 && (
                  <Button
                    fontSize={2}
                    padding={3}
                    mode="ghost"
                    text={`Update empty (${videosWithEmptyOrPlaceholder})`}
                    tone="caution"
                    onClick={props.syncOnlyEmpty}
                    disabled={isResyncing || !canTriggerResync}
                  />
                )}
                <Button
                  icon={SyncIcon}
                  fontSize={2}
                  padding={3}
                  mode="ghost"
                  text={`Update all (${videosToUpdate})`}
                  tone="positive"
                  onClick={props.syncAllVideos}
                  iconRight={isResyncing && Spinner}
                  disabled={!canTriggerResync}
                />
              </Flex>
            </Flex>
          </Card>
        )
      }
    >
      <Box padding={4}>
        {/* LOADING ASSETS STATE */}
        {(props.muxAssets.loading || props.sanityAssetsLoading) && (
          <Card tone="primary" marginBottom={5} padding={3} border>
            <Flex align="center" gap={4}>
              <Spinner muted size={4} />
              <Stack space={2}>
                <Text size={2} weight="semibold">
                  Loading assets from Mux
                </Text>
                <Text size={1}>This may take a while.</Text>
              </Stack>
            </Flex>
          </Card>
        )}

        {/* ERROR LOADING MUX */}
        {props.muxAssets.error && (
          <Card tone="critical" marginBottom={5} padding={3} border>
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
          <Card tone="primary" marginBottom={5} padding={3} border>
            <Flex align="center" gap={4}>
              <Spinner muted size={4} />
              <Stack space={2}>
                <Text size={2} weight="semibold">
                  Updating video metadata
                </Text>
                <Text size={1}>Syncing titles from Mux...</Text>
              </Stack>
            </Flex>
          </Card>
        )}

        {/* ERROR SYNCING */}
        {resyncState === 'error' && (
          <Card tone="critical" marginBottom={5} padding={3} border>
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
          <Stack paddingY={5} marginBottom={4} space={3} style={{textAlign: 'center'}}>
            <Box>
              <CheckmarkCircleIcon fontSize={48} />
            </Box>
            <Heading size={2}>Metadata synced successfully</Heading>
            <Text size={2}>All video titles have been updated from Mux.</Text>
          </Stack>
        )}

        {/* CONFIRMATION MESSAGE */}
        {resyncState === 'idle' && !props.muxAssets.loading && !props.sanityAssetsLoading && (
          <Stack space={4}>
            <Heading size={1}>
              There {videosToUpdate === 1 ? 'is' : 'are'} {videosToUpdate} video
              {videosToUpdate === 1 ? '' : 's'} with Mux metadata
            </Heading>
            <Text size={2}>
              This will update video titles in Sanity to match those in Mux. No new videos will be
              created.
            </Text>
            {videosWithEmptyOrPlaceholder > 0 && (
              <Card padding={3} tone="caution" border>
                <Flex align="flex-start" gap={2}>
                  <Box>
                    <ErrorOutlineIcon />
                  </Box>
                  <Stack space={2}>
                    <Text size={2} weight="semibold">
                      Videos with empty or placeholder titles
                    </Text>
                    <Text size={1} muted>
                      {videosWithEmptyOrPlaceholder} video
                      {videosWithEmptyOrPlaceholder === 1 ? '' : 's'} without titles or with
                      placeholder titles (e.g., &quot;Asset #123&quot;) can be updated selectively.
                    </Text>
                  </Stack>
                </Flex>
              </Card>
            )}
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
  return <Button mode="bleed" text="Resync Metadata" onClick={resyncMetadata.openDialog} />
}
