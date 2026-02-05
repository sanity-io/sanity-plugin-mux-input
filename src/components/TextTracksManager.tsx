import {
  AddIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DownloadIcon,
  EditIcon,
  ErrorOutlineIcon,
  TrashIcon,
} from '@sanity/icons'
import {Box, Button, Card, Dialog, Flex, Heading, Spinner, Stack, Text, useToast} from '@sanity/ui'
import {useEffect, useId, useMemo, useState} from 'react'

import {deleteTextTrack} from '../actions/assets'
import {useClient} from '../hooks/useClient'
import {useResyncAsset} from '../hooks/useResyncAsset'
import {downloadVttFile} from '../util/textTracks'
import type {MuxTextTrack, VideoAssetDocument} from '../util/types'
import AddCaptionDialog from './AddCaptionDialog'
import EditCaptionDialog from './EditCaptionDialog'

interface TrackCardProps {
  track: MuxTextTrack
  iconOnly: boolean
  downloadingTrackId: string | null
  deletingTrackId: string | null
  trackToEdit: MuxTextTrack | null
  getTrackSourceLabel: (track: MuxTextTrack) => string
  handleDownload: (track: MuxTextTrack) => void
  setTrackToEdit: (track: MuxTextTrack) => void
  setTrackToDelete: (track: MuxTextTrack) => void
}

function TrackCard({
  track,
  iconOnly,
  downloadingTrackId,
  deletingTrackId,
  trackToEdit,
  getTrackSourceLabel,
  handleDownload,
  setTrackToEdit,
  setTrackToDelete,
}: TrackCardProps) {
  const isDisabled = (action: 'download' | 'edit' | 'delete') => {
    if (action === 'download') {
      return (
        downloadingTrackId !== null || deletingTrackId === track.id || trackToEdit?.id === track.id
      )
    }
    if (action === 'edit') {
      return (
        downloadingTrackId === track.id ||
        deletingTrackId === track.id ||
        trackToEdit?.id === track.id
      )
    }
    return (
      downloadingTrackId === track.id || deletingTrackId !== null || trackToEdit?.id === track.id
    )
  }

  const renderActionButtons = () => {
    if (track.status === 'preparing') {
      return (
        <Flex align="center" gap={2}>
          <Spinner
            muted
            style={{
              width: '0.75em',
              height: '0.75em',
              verticalAlign: 'middle',
              display: 'inline-block',
              marginBottom: '-2px',
            }}
          />
          <Text size={1} muted>
            Processing...
          </Text>
        </Flex>
      )
    }

    return (
      <Flex gap={2}>
        {track.status !== 'errored' && (
          <Button
            icon={
              downloadingTrackId === track.id ? (
                <Spinner
                  style={{
                    verticalAlign: 'middle',
                    display: 'inline-block',
                    marginTop: '-2px',
                    width: '0.5em',
                    height: '0.5em',
                  }}
                />
              ) : (
                <DownloadIcon />
              )
            }
            text={iconOnly ? undefined : 'Download'}
            mode="ghost"
            tone="primary"
            fontSize={1}
            padding={2}
            onClick={() => handleDownload(track)}
            disabled={isDisabled('download')}
            title="Download"
          />
        )}
        <Button
          icon={<EditIcon />}
          text={iconOnly ? undefined : 'Edit'}
          mode="ghost"
          tone="primary"
          fontSize={1}
          padding={2}
          disabled={isDisabled('edit')}
          onClick={() => setTrackToEdit(track)}
          title="Edit"
        />
        <Button
          icon={
            deletingTrackId === track.id ? (
              <Spinner
                style={{
                  verticalAlign: 'middle',
                  display: 'inline-block',
                  marginTop: '-2px',
                  width: '0.5em',
                  height: '0.5em',
                }}
              />
            ) : (
              <TrashIcon />
            )
          }
          text={iconOnly ? undefined : 'Delete'}
          mode="ghost"
          tone="critical"
          fontSize={1}
          padding={2}
          disabled={isDisabled('delete')}
          onClick={() => setTrackToDelete(track)}
          title="Delete"
        />
      </Flex>
    )
  }

  return (
    <Card
      padding={3}
      radius={2}
      tone={track.status === 'errored' ? 'caution' : 'transparent'}
      border
    >
      <Flex align="center" justify="space-between" gap={3}>
        <Stack space={2} flex={1}>
          <Flex align="center" gap={2}>
            <Text weight="semibold">{track.name || 'Untitled'}</Text>
            <Text size={1} muted>
              ({getTrackSourceLabel(track)})
            </Text>
            {track.status === 'errored' && (
              <ErrorOutlineIcon
                style={{color: 'var(--card-critical-color)'}}
                aria-label="Error"
                fontSize={20}
              />
            )}
          </Flex>
          {track.language_code && (
            <Text size={1} muted>
              Language: {track.language_code}
            </Text>
          )}
          {track.status === 'errored' && track.error && (
            <Text size={1} style={{color: 'var(--card-critical-color)'}}>
              {track.error.messages?.[0] || track.error.type || 'Failed to process track'}
            </Text>
          )}
        </Stack>
        {renderActionButtons()}
      </Flex>
    </Card>
  )
}

interface TextTracksManagerProps {
  asset: VideoAssetDocument
  iconOnly?: boolean
  tracks?: MuxTextTrack[]
  collapseTracks?: boolean
}

export default function TextTracksManager({
  asset,
  iconOnly = false,
  tracks: propTracks,
  collapseTracks = false,
}: TextTracksManagerProps) {
  const client = useClient()
  const toast = useToast()
  const dialogId = `DeleteCaptionDialog${useId()}`
  const {resyncAsset} = useResyncAsset()
  const [downloadingTrackId, setDownloadingTrackId] = useState<string | null>(null)
  const [deletingTrackId, setDeletingTrackId] = useState<string | null>(null)
  const [addedTracks, setAddedTracks] = useState<MuxTextTrack[]>([])
  const [updatedTracks, setUpdatedTracks] = useState<Map<string, MuxTextTrack>>(new Map())
  const [trackActivityOrder, setTrackActivityOrder] = useState<Map<string, number>>(new Map())
  const [autogeneratedTrackIds, setAutogeneratedTrackIds] = useState<Set<string>>(new Set())
  const [trackToDelete, setTrackToDelete] = useState<MuxTextTrack | null>(null)
  const [trackToEdit, setTrackToEdit] = useState<MuxTextTrack | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const MAX_VISIBLE_TRACKS = 4

  const realTracks: MuxTextTrack[] = propTracks
    ? propTracks
    : asset.data?.tracks?.filter((track): track is MuxTextTrack => track.type === 'text') || []

  const activeTracks = realTracks.filter(
    (track) =>
      track.id &&
      (track.status === 'ready' || track.status === 'preparing' || track.status === 'errored')
  )

  const allTracks = useMemo(() => {
    const tracksWithUpdates = activeTracks.map((track) => {
      const updated = updatedTracks.get(track.id)
      return updated || track
    })

    const isMockTrackReplaced = (mockTrack: MuxTextTrack, realTracksList: MuxTextTrack[]) => {
      if (!mockTrack.id || !mockTrack.id.startsWith('generating-')) {
        return false
      }
      return realTracksList.some((realTrack) => {
        const nameMatches = realTrack.name === mockTrack.name
        const languageMatches = realTrack.language_code === mockTrack.language_code
        if (!nameMatches || !languageMatches) {
          return false
        }
        if (realTrack.status === 'ready') {
          const isGenerated =
            realTrack.text_source === 'generated_live' ||
            realTrack.text_source === 'generated_live_final' ||
            realTrack.text_source === 'generated_vod'
          return isGenerated
        }
        if (realTrack.status === 'preparing') {
          return true
        }
        return false
      })
    }

    const isTrackAlreadyInRealTracks = (
      addedTrack: MuxTextTrack,
      realTracksList: MuxTextTrack[]
    ) => {
      if (!addedTrack.id) return false
      if (addedTrack.id.startsWith('generating-')) {
        return isMockTrackReplaced(addedTrack, realTracksList)
      }
      return realTracksList.some((realTrack) => realTrack.id === addedTrack.id)
    }

    const tracksToKeep = addedTracks.filter((addedTrack) => {
      if (addedTrack.id && addedTrack.id.startsWith('generating-')) {
        return !isMockTrackReplaced(addedTrack, tracksWithUpdates)
      }
      return !isTrackAlreadyInRealTracks(addedTrack, tracksWithUpdates)
    })

    return [...tracksWithUpdates, ...tracksToKeep]
  }, [activeTracks, addedTracks, updatedTracks])

  useEffect(() => {
    const newAutogeneratedIds = new Set<string>()

    activeTracks.forEach((track) => {
      if (
        track.id &&
        (track.text_source === 'generated_live' ||
          track.text_source === 'generated_live_final' ||
          track.text_source === 'generated_vod')
      ) {
        newAutogeneratedIds.add(track.id)
      }
    })

    addedTracks.forEach((mockTrack) => {
      if (mockTrack.id && mockTrack.id.startsWith('generating-')) {
        const realTrack = activeTracks.find((rt) => {
          const nameMatches = rt.name === mockTrack.name
          const languageMatches = rt.language_code === mockTrack.language_code
          return nameMatches && languageMatches
        })
        if (realTrack?.id) {
          newAutogeneratedIds.add(realTrack.id)
        }
      }
    })

    setAutogeneratedTrackIds((prev) => {
      let hasNew = false
      const updated = new Set(prev)
      newAutogeneratedIds.forEach((id) => {
        if (!prev.has(id)) {
          updated.add(id)
          hasNew = true
        }
      })
      return hasNew ? updated : prev
    })
  }, [activeTracks, addedTracks])

  useEffect(() => {
    const preparingTracks = allTracks.filter((track) => track.status === 'preparing')
    if (preparingTracks.length === 0 || !asset.assetId || !asset._id) {
      return undefined
    }

    const interval = setInterval(async () => {
      try {
        const muxData = await resyncAsset(asset)
        if (!muxData) return

        const fetchedTracks =
          muxData.tracks?.filter((track): track is MuxTextTrack => track.type === 'text') || []

        const isMockTrackReplaced = (
          mockTrack: MuxTextTrack,
          fetchedTracksList: MuxTextTrack[]
        ) => {
          if (!mockTrack.id || !mockTrack.id.startsWith('generating-')) {
            return false
          }
          return fetchedTracksList.some((realTrack) => {
            const nameMatches = realTrack.name === mockTrack.name
            const languageMatches = realTrack.language_code === mockTrack.language_code
            if (!nameMatches || !languageMatches) {
              return false
            }
            if (realTrack.status === 'ready') {
              const isGenerated =
                realTrack.text_source === 'generated_live' ||
                realTrack.text_source === 'generated_live_final' ||
                realTrack.text_source === 'generated_vod'
              return isGenerated
            }
            if (realTrack.status === 'preparing') {
              return true
            }
            return false
          })
        }

        const newAutogeneratedIds = new Set<string>()
        fetchedTracks.forEach((track) => {
          if (
            track.id &&
            (track.text_source === 'generated_live' ||
              track.text_source === 'generated_live_final' ||
              track.text_source === 'generated_vod')
          ) {
            newAutogeneratedIds.add(track.id)
          }
        })

        const findMatchingRealTrack = (mockTrack: MuxTextTrack, tracksList: MuxTextTrack[]) => {
          return tracksList.find((rt) => {
            const nameMatches = rt.name === mockTrack.name
            const languageMatches = rt.language_code === mockTrack.language_code
            return nameMatches && languageMatches
          })
        }

        setAddedTracks((prev) => {
          return prev.filter((mockTrack) => {
            if (mockTrack.id && mockTrack.id.startsWith('generating-')) {
              const replaced = isMockTrackReplaced(mockTrack, fetchedTracks)
              if (replaced) {
                const realTrack = findMatchingRealTrack(mockTrack, fetchedTracks)
                if (realTrack?.id) {
                  newAutogeneratedIds.add(realTrack.id)
                  setTrackActivityOrder((prevOrder) => {
                    const mockOrder = prevOrder.get(mockTrack.id)
                    if (mockOrder) {
                      const newMap = new Map(prevOrder)
                      newMap.set(realTrack.id, mockOrder)
                      return newMap
                    }
                    return prevOrder
                  })
                }
              }
              return !replaced
            }
            return true
          })
        })

        if (newAutogeneratedIds.size > 0) {
          setAutogeneratedTrackIds((prevIds) => {
            const updated = new Set(prevIds)
            newAutogeneratedIds.forEach((id) => updated.add(id))
            return updated
          })
        }
      } catch (error) {
        console.error('Failed to refresh asset data:', error)
      }
    }, 3000) // Poll every 3 seconds

    return () => clearInterval(interval)
  }, [allTracks, asset, resyncAsset])

  const visibleTracks = allTracks
    .filter(
      (track) =>
        track.status === 'ready' || track.status === 'preparing' || track.status === 'errored'
    )
    .sort((a, b) => {
      const orderA = trackActivityOrder.get(a.id) || 0
      const orderB = trackActivityOrder.get(b.id) || 0

      if (orderA > 0 && orderB > 0) {
        return orderB - orderA
      }

      if (orderA > 0) return -1
      if (orderB > 0) return 1

      const aIsPreparing = a.status === 'preparing'
      const bIsPreparing = b.status === 'preparing'
      if (aIsPreparing && !bIsPreparing) return -1
      if (!aIsPreparing && bIsPreparing) return 1

      const aIsAutogenerated =
        (a.id && a.id.startsWith('generating-')) || (a.id && autogeneratedTrackIds.has(a.id))
      const bIsAutogenerated =
        (b.id && b.id.startsWith('generating-')) || (b.id && autogeneratedTrackIds.has(b.id))
      if (aIsAutogenerated && !bIsAutogenerated) return -1
      if (!aIsAutogenerated && bIsAutogenerated) return 1

      return 0
    })

  const handleDownload = async (track: MuxTextTrack) => {
    if (!track.id) return

    setDownloadingTrackId(track.id)
    try {
      await downloadVttFile(client, asset, track)
    } catch (error) {
      toast.push({
        title: 'Failed to download VTT file',
        status: 'error',
        description: error instanceof Error ? error.message : 'Please try again',
      })
    } finally {
      setDownloadingTrackId(null)
    }
  }

  const confirmDelete = async () => {
    if (!trackToDelete || !trackToDelete.id) return

    const track = trackToDelete
    setTrackToDelete(null)
    setDeletingTrackId(track.id)
    try {
      if (!asset.assetId) {
        throw new Error('Asset ID is required')
      }
      await deleteTextTrack(client, asset.assetId, track.id)

      // Refresh asset data after deletion
      await resyncAsset(asset)

      toast.push({
        title: 'Successfully deleted caption track',
        status: 'success',
      })

      setAddedTracks((prev) => prev.filter((t) => t.id !== track.id))
      setUpdatedTracks((prev) => {
        const newMap = new Map(prev)
        newMap.delete(track.id)
        return newMap
      })
      setTrackActivityOrder((prev) => {
        const newMap = new Map(prev)
        newMap.delete(track.id)
        return newMap
      })
      setAutogeneratedTrackIds((prev) => {
        const updated = new Set(prev)
        updated.delete(track.id)
        return updated
      })
    } catch (error) {
      toast.push({
        title: 'Failed to delete caption track',
        status: 'error',
        description: error instanceof Error ? error.message : 'Please try again',
      })
    } finally {
      setDeletingTrackId(null)
    }
  }

  const handleAddTrack = (track: MuxTextTrack) => {
    setAddedTracks((prev) => [...prev, track])
    setTrackActivityOrder((prev) => {
      const newMap = new Map(prev)
      newMap.set(track.id, prev.size + 1)
      return newMap
    })
    setShowAddDialog(false)
  }

  const handleUpdateTrack = async (updatedTrack: MuxTextTrack, oldTrackId?: string) => {
    if (oldTrackId) {
      setAddedTracks((prev) => prev.filter((t) => t.id !== oldTrackId))
      setUpdatedTracks((prev) => {
        const newMap = new Map(prev)
        newMap.delete(oldTrackId)
        return newMap
      })
      setTrackActivityOrder((prev) => {
        const newMap = new Map(prev)
        newMap.delete(oldTrackId)
        return newMap
      })
      setAutogeneratedTrackIds((prev) => {
        const updated = new Set(prev)
        updated.delete(oldTrackId)
        return updated
      })
    }

    const isAddedTrack = addedTracks.some((t) => t.id === updatedTrack.id)

    if (isAddedTrack) {
      setAddedTracks((prev) => prev.map((t) => (t.id === updatedTrack.id ? updatedTrack : t)))
    } else {
      setUpdatedTracks((prev) => {
        const newMap = new Map(prev)
        newMap.set(updatedTrack.id, updatedTrack)
        return newMap
      })
    }

    setTrackActivityOrder((prev) => {
      const newMap = new Map(prev)
      newMap.set(updatedTrack.id, prev.size + 1)
      return newMap
    })

    setTrackToEdit(null)

    // Refresh asset data after update
    await resyncAsset(asset)
  }

  const getTrackSourceLabel = (track: MuxTextTrack) => {
    if (track.id && track.id.startsWith('generating-')) {
      return 'Auto-generated'
    }
    if (track.id && autogeneratedTrackIds.has(track.id)) {
      return 'Auto-generated'
    }
    if (
      track.text_source === 'generated_live_final' ||
      track.text_source === 'generated_live' ||
      track.text_source === 'generated_vod'
    ) {
      return 'Auto-generated'
    }
    if (track.text_source === 'uploaded') {
      return 'Uploaded'
    }
    return 'Custom'
  }

  if (visibleTracks.length === 0 && !showAddDialog) {
    return (
      <Stack space={3}>
        <Flex justify="flex-end">
          <Button
            icon={AddIcon}
            text="Add Caption"
            tone="primary"
            onClick={() => setShowAddDialog(true)}
          />
        </Flex>
        <Card padding={4} radius={2} tone="transparent" border>
          <Text size={1} muted>
            No captions available. Add captions when uploading a video or add them manually.
          </Text>
        </Card>
        {showAddDialog && (
          <AddCaptionDialog
            asset={asset}
            onAdd={handleAddTrack}
            onClose={() => setShowAddDialog(false)}
          />
        )}
      </Stack>
    )
  }

  const displayedTracks =
    collapseTracks && !isExpanded ? visibleTracks.slice(0, MAX_VISIBLE_TRACKS) : visibleTracks
  const hasMoreTracks = collapseTracks && visibleTracks.length > MAX_VISIBLE_TRACKS

  return (
    <Stack space={3}>
      <Flex justify="flex-end">
        <Button
          icon={AddIcon}
          text="Add Caption"
          tone="primary"
          onClick={() => setShowAddDialog(true)}
        />
      </Flex>

      {displayedTracks.map((track) => (
        <TrackCard
          key={track.id}
          track={track}
          iconOnly={iconOnly}
          downloadingTrackId={downloadingTrackId}
          deletingTrackId={deletingTrackId}
          trackToEdit={trackToEdit}
          getTrackSourceLabel={getTrackSourceLabel}
          handleDownload={handleDownload}
          setTrackToEdit={setTrackToEdit}
          setTrackToDelete={setTrackToDelete}
        />
      ))}

      {hasMoreTracks && (
        <Flex justify="center">
          <Button
            icon={isExpanded ? ChevronUpIcon : ChevronDownIcon}
            text={
              isExpanded ? 'Show less' : `Show ${visibleTracks.length - MAX_VISIBLE_TRACKS} more`
            }
            mode="ghost"
            tone="primary"
            onClick={() => setIsExpanded(!isExpanded)}
          />
        </Flex>
      )}

      {trackToDelete && (
        <Dialog
          animate
          id={dialogId}
          header="Delete track"
          onClose={() => setTrackToDelete(null)}
          onClickOutside={() => setTrackToDelete(null)}
          width={1}
        >
          <Card
            padding={3}
            style={{
              minHeight: '150px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Stack space={3}>
              <Heading size={2}>
                Are you sure you want to delete &quot;
                {trackToDelete.name || trackToDelete.language_code || 'Untitled'}&quot;?
              </Heading>
              <Text size={2}>This action is irreversible</Text>
              <Stack space={4} marginY={4}>
                <Box>
                  <Button
                    icon={
                      deletingTrackId === trackToDelete.id ? (
                        <Spinner
                          style={{
                            verticalAlign: 'middle',
                            display: 'inline-block',
                            marginTop: '-2px',
                            width: '0.5em',
                            height: '0.5em',
                          }}
                        />
                      ) : (
                        <TrashIcon />
                      )
                    }
                    fontSize={2}
                    padding={3}
                    text="Delete track"
                    tone="critical"
                    onClick={confirmDelete}
                    disabled={deletingTrackId !== null}
                  />
                </Box>
              </Stack>
            </Stack>
          </Card>
        </Dialog>
      )}

      {showAddDialog && (
        <AddCaptionDialog
          asset={asset}
          onAdd={handleAddTrack}
          onClose={() => setShowAddDialog(false)}
        />
      )}

      {trackToEdit && (
        <EditCaptionDialog
          asset={asset}
          track={trackToEdit}
          onUpdate={handleUpdateTrack}
          onClose={() => setTrackToEdit(null)}
        />
      )}
    </Stack>
  )
}
