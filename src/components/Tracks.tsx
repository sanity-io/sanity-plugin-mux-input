import {DocumentVideoIcon, PlayIcon} from '@sanity/icons'
import {Box, Button, Stack, Text} from '@sanity/ui'
import {useCallback, useState} from 'react'
import {useClient} from 'sanity'

import {deleteTrackOnMux} from '../actions/assets'
import type {VideoAssetDocument} from '../util/types'
import IconInfo from './IconInfo'

type TracksProps = {
  assetId: string
  tracks: NonNullable<VideoAssetDocument['data']>['tracks']
}

export function Tracks({assetId, tracks = []}: TracksProps) {
  const client = useClient()

  const [status, setStatus] = useState<'deleting' | 'idle'>('idle')
  const handleDelete = useCallback(
    async (trackId: string) => {
      setStatus('deleting')
      await deleteTrackOnMux(client, assetId, trackId)
      setStatus('idle')
    },
    [assetId, client]
  )

  if (!tracks.length) {
    return <Text>No tracks</Text>
  }

  return (
    <Stack space={3}>
      {tracks.map((track) => (
        <Box key={track.id}>
          {track.type === 'video' && <IconInfo icon={DocumentVideoIcon} text="Video" />}
          {track.type === 'audio' && <IconInfo icon={PlayIcon} text="Audio" />}
          {track.type === 'text' && <IconInfo icon={DocumentVideoIcon} text="Text" />}
          {track.type === 'text' && (
            <Button
              onClick={() => handleDelete(track.id)}
              text="Delete"
              tone="critical"
              disabled={status !== 'idle'}
            />
          )}
        </Box>
      ))}
    </Stack>
  )
}
