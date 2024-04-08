import {CheckmarkCircleIcon, ErrorOutlineIcon, RetrieveIcon, RetryIcon} from '@sanity/icons'
import {
  Box,
  Button,
  Card,
  Checkbox,
  Code,
  Dialog,
  Flex,
  Heading,
  Spinner,
  Stack,
  Text,
} from '@sanity/ui'
import {truncateString, useFormattedDuration} from 'sanity'
import {styled} from 'styled-components'

import useImportMuxAssets from '../hooks/useImportMuxAssets'
import {DIALOGS_Z_INDEX} from '../util/constants'
import type {MuxAsset} from '../util/types'
import VideoThumbnail from './VideoThumbnail'

const MissingAssetCheckbox = styled(Checkbox)`
  position: static !important;

  input::after {
    content: '';
    position: absolute;
    inset: 0;
    display: block;
    cursor: pointer;
    z-index: 1000;
  }
`

function MissingAsset({
  asset,
  selectAsset,
  selected,
}: {
  asset: MuxAsset
  selectAsset: (selected: boolean) => void
  selected: boolean
}) {
  const duration = useFormattedDuration(asset.duration * 1000)

  return (
    <Card
      key={asset.id}
      tone={selected ? 'positive' : undefined}
      border
      paddingX={2}
      paddingY={3}
      style={{position: 'relative'}}
      radius={1}
    >
      <Flex align="center" gap={2}>
        <MissingAssetCheckbox
          checked={selected}
          onChange={(e) => {
            selectAsset(e.currentTarget.checked)
          }}
          aria-label={selected ? `Import video ${asset.id}` : `Skip import of video ${asset.id}`}
        />
        <VideoThumbnail
          asset={{
            assetId: asset.id,
            data: asset,
            filename: asset.id,
            playbackId: asset.playback_ids.find((p) => p.id)?.id,
          }}
          width={150}
        />
        <Stack space={2}>
          <Flex align="center" gap={1}>
            <Code size={2}>{truncateString(asset.id, 15)}</Code>{' '}
            <Text muted size={2}>
              ({duration.formatted})
            </Text>
          </Flex>
          <Text size={1}>
            Uploaded at{' '}
            {new Date(Number(asset.created_at) * 1000).toLocaleDateString('en', {
              year: 'numeric',
              day: '2-digit',
              month: '2-digit',
            })}
          </Text>
        </Stack>
      </Flex>
    </Card>
  )
}

// eslint-disable-next-line complexity
function ImportVideosDialog(props: ReturnType<typeof useImportMuxAssets>) {
  const {importState} = props

  const canTriggerImport =
    (importState === 'idle' || importState === 'error') && props.selectedAssets.length > 0
  const isImporting = importState === 'importing'
  const noAssetsToImport =
    props.missingAssets?.length === 0 && !props.muxAssets.loading && !props.assetsInSanityLoading

  return (
    <Dialog
      animate
      header={'Import videos from Mux'}
      zOffset={DIALOGS_Z_INDEX}
      id="video-details-dialog"
      onClose={props.closeDialog}
      onClickOutside={props.closeDialog}
      width={1}
      position="fixed"
      footer={
        importState !== 'done' &&
        !noAssetsToImport && (
          <Card padding={3}>
            <Flex justify="space-between" align="center">
              <Button
                fontSize={2}
                padding={3}
                mode="bleed"
                text="Cancel"
                tone="critical"
                onClick={props.closeDialog}
                disabled={isImporting}
              />
              {props.missingAssets && (
                <Button
                  icon={RetrieveIcon}
                  fontSize={2}
                  padding={3}
                  mode="ghost"
                  text={
                    props.selectedAssets?.length > 0
                      ? `Import ${props.selectedAssets.length} video(s)`
                      : 'No video(s) selected'
                  }
                  tone="positive"
                  onClick={props.importAssets}
                  iconRight={isImporting && Spinner}
                  disabled={!canTriggerImport}
                />
              )}
            </Flex>
          </Card>
        )
      }
    >
      <Box padding={3}>
        {/* LOADING ASSETS STATE */}
        {(props.muxAssets.loading || props.assetsInSanityLoading) && (
          <Card tone="primary" marginBottom={5} padding={3} border>
            <Flex align="center" gap={4}>
              <Spinner muted size={4} />
              <Stack space={2}>
                <Text size={2} weight="semibold">
                  Loading assets from Mux
                </Text>
                <Text size={1}>
                  This may take a while.
                  {props.missingAssets &&
                    props.missingAssets.length > 0 &&
                    ` There are at least ${props.missingAssets.length} video${props.missingAssets.length > 1 ? 's' : ''} currently not in Sanity...`}
                </Text>
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
                  There was an error getting all data from Mux
                </Text>
                <Text size={1}>
                  {props.missingAssets
                    ? `But we've found ${props.missingAssets.length} video${props.missingAssets.length > 1 ? 's' : ''} not in Sanity, which you can start importing now.`
                    : 'Please try again or contact a developer for help.'}
                </Text>
              </Stack>
            </Flex>
          </Card>
        )}

        {/* IMPORTING STATE */}
        {importState === 'importing' && (
          <Card tone="primary" marginBottom={5} padding={3} border>
            <Flex align="center" gap={4}>
              <Spinner muted size={4} />
              <Stack space={2}>
                <Text size={2} weight="semibold">
                  Importing {props.selectedAssets.length} video
                  {props.selectedAssets.length > 1 && 's'} from Mux
                </Text>
              </Stack>
            </Flex>
          </Card>
        )}

        {/* ERROR IMPORTING */}
        {importState === 'error' && (
          <Card tone="critical" marginBottom={5} padding={3} border>
            <Flex align="center" gap={2}>
              <ErrorOutlineIcon fontSize={36} />
              <Stack space={2}>
                <Text size={2} weight="semibold">
                  There was an error importing videos
                </Text>
                <Text size={1}>
                  {props.importError
                    ? `Error: ${props.importError}`
                    : 'Please try again or contact a developer for help.'}
                </Text>
                <Box marginTop={1}>
                  <Button
                    icon={RetryIcon}
                    text="Retry"
                    tone="primary"
                    onClick={props.importAssets}
                  />
                </Box>
              </Stack>
            </Flex>
          </Card>
        )}

        {/* NO ASSETS TO IMPORT or SUCESS STATE */}
        {(noAssetsToImport || importState === 'done') && (
          <Stack paddingY={5} marginBottom={4} space={3} style={{textAlign: 'center'}}>
            <Box>
              <CheckmarkCircleIcon fontSize={48} />
            </Box>
            <Heading size={2}>
              {importState === 'done'
                ? `Videos imported successfully`
                : 'There are no Mux videos to import'}
            </Heading>
            <Text size={2}>
              {importState === 'done'
                ? 'You can now use them in your Sanity content.'
                : "They're all in Sanity and ready to be used in your content."}
            </Text>
          </Stack>
        )}

        {/* MISSING ASSETS SELECTOR */}
        {props.missingAssets &&
          props.missingAssets.length > 0 &&
          (importState === 'idle' || importState === 'error') && (
            <Stack space={4}>
              <Heading size={1}>
                There are {props.missingAssets.length}
                {props.muxAssets.loading && '+'} Mux video{props.missingAssets.length > 1 && 's'}{' '}
                not in Sanity
              </Heading>
              {!props.muxAssets.loading && (
                <Flex align="center" paddingX={2}>
                  <Checkbox
                    id="import-all"
                    style={{display: 'block'}}
                    onClick={(e) => {
                      const selectAll = e.currentTarget.checked
                      if (selectAll) {
                        // eslint-disable-next-line no-unused-expressions
                        props.missingAssets && props.setSelectedAssets(props.missingAssets)
                      } else {
                        props.setSelectedAssets([])
                      }
                    }}
                    checked={props.selectedAssets.length === props.missingAssets.length}
                  />
                  <Box flex={1} paddingLeft={3} as="label" htmlFor="import-all">
                    <Text>Import all</Text>
                  </Box>
                </Flex>
              )}
              {props.missingAssets.map((asset) => (
                <MissingAsset
                  key={asset.id}
                  asset={asset}
                  selectAsset={(selected) => {
                    if (selected) {
                      props.setSelectedAssets([...props.selectedAssets, asset])
                    } else {
                      props.setSelectedAssets(props.selectedAssets.filter((a) => a.id !== asset.id))
                    }
                  }}
                  selected={props.selectedAssets.some((a) => a.id === asset.id)}
                />
              ))}
            </Stack>
          )}
      </Box>
    </Dialog>
  )
}

export default function ImportVideosFromMux() {
  const importAssets = useImportMuxAssets()

  if (!importAssets.hasSecrets) {
    return
  }

  if (importAssets.dialogOpen) {
    // eslint-disable-next-line consistent-return
    return <ImportVideosDialog {...importAssets} />
  }

  // eslint-disable-next-line consistent-return
  return <Button mode="bleed" text="Import from Mux" onClick={importAssets.openDialog} />
}
