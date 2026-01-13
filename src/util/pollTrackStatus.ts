import type {SanityClient} from '@sanity/client'

import {getAsset} from '../actions/assets'
import type {MuxTextTrack} from './types'

export interface PollTrackStatusOptions {
  client: SanityClient
  assetId: string
  trackName: string
  trackLanguageCode: string
  maxAttempts?: number
  onTrackFound?: (track: MuxTextTrack) => void
  onTrackErrored?: (track: MuxTextTrack) => void
  onTrackReady?: (track: MuxTextTrack) => void
}

export interface PollTrackStatusResult {
  track: MuxTextTrack | undefined
  found: boolean
  status: 'ready' | 'preparing' | 'errored' | 'not-found'
}

/**
 * Polls Mux API to find and track the status of a newly added text track.
 * The track may be in "preparing" state initially, then become "ready" or "errored".
 *
 * @param options - Configuration options for polling
 * @returns Promise resolving to the poll result
 */
export async function pollTrackStatus(
  options: PollTrackStatusOptions
): Promise<PollTrackStatusResult> {
  const {
    client,
    assetId,
    trackName,
    trackLanguageCode,
    maxAttempts = 10,
    onTrackFound,
    onTrackErrored,
    onTrackReady,
  } = options

  const trimmedName = trackName.trim()
  const trimmedLanguageCode = trackLanguageCode.trim()
  let newTrack: MuxTextTrack | undefined
  let attempts = 0
  let trackFound = false

  const findTrack = (textTracks: MuxTextTrack[]): MuxTextTrack | undefined => {
    let foundTrack = textTracks.find(
      (track) => track.name === trimmedName && track.language_code === trimmedLanguageCode
    )

    if (!foundTrack) {
      foundTrack = textTracks.find((track) => track.language_code === trimmedLanguageCode)
    }

    if (!foundTrack && textTracks.length > 0) {
      foundTrack = textTracks[textTracks.length - 1]
    }

    return foundTrack
  }

  while (attempts < maxAttempts) {
    try {
      if (attempts > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }

      const assetData = await getAsset(client, assetId)
      const textTracks =
        assetData.data.tracks?.filter((track): track is MuxTextTrack => track.type === 'text') || []

      const foundTrack = findTrack(textTracks)

      if (!foundTrack) {
        attempts++
        continue
      }

      trackFound = true
      newTrack = foundTrack

      if (onTrackFound) {
        onTrackFound(foundTrack)
      }

      if (foundTrack.status === 'ready') {
        if (onTrackReady) {
          onTrackReady(foundTrack)
        }
        break
      }

      if (foundTrack.status === 'errored') {
        if (onTrackErrored) {
          onTrackErrored(foundTrack)
        }
        return {
          track: foundTrack,
          found: true,
          status: 'errored',
        }
      }
    } catch (error) {
      console.error('Failed to fetch updated asset:', error)
    }

    attempts++
  }

  if (!newTrack || !trackFound) {
    return {
      track: undefined,
      found: false,
      status: 'not-found',
    }
  }

  if (newTrack.status === 'preparing') {
    return {
      track: newTrack,
      found: true,
      status: 'preparing',
    }
  }

  return {
    track: newTrack,
    found: true,
    status: 'ready',
  }
}
