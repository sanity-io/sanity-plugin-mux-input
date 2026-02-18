import type {SanityClient} from '@sanity/client'

import {getAsset} from '../actions/assets'
import {generateJwt} from './generateJwt'
import {getPlaybackId} from './getPlaybackPolicy'
import {getPlaybackPolicy} from './getPlaybackPolicy'
import type {MuxTextTrack, VideoAssetDocument} from './types'

export function extractErrorMessage(
  error: unknown,
  defaultMessage = 'Failed to process request'
): string {
  let message = ''

  if (error && typeof error === 'object') {
    const err = error as {response?: {body?: {message?: string}}; message?: string}
    message = err.response?.body?.message || err.message || ''
  } else if (typeof error === 'string') {
    message = error
  }

  if (!message) {
    return defaultMessage
  }

  const match = message.match(/\(([^)]+)\)/)
  if (match && match[1]) {
    return match[1]
  }

  if (message.includes('responded with')) {
    const parts = message.split('(')
    if (parts.length > 1) {
      return parts[parts.length - 1].replace(')', '').trim()
    }
  }

  return message
}

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

/**
 * May throw a Promise. Call this with {@link tryWithSuspend} or rethrow the Promise
 */
export async function downloadVttFile(
  client: SanityClient,
  asset: VideoAssetDocument,
  track: MuxTextTrack
): Promise<void> {
  if (!track.id) {
    throw new Error('Track ID is missing')
  }

  if (track.status !== 'ready') {
    throw new Error(`Track is not ready yet. Status: ${track.status}`)
  }

  if (!asset.assetId) {
    throw new Error('Asset ID is required')
  }

  const playbackId = getPlaybackId(asset)
  if (!playbackId) {
    throw new Error('Playback ID is required')
  }

  const playbackPolicy = getPlaybackPolicy(asset)?.policy

  let downloadUrl = `https://stream.mux.com/${playbackId}/text/${track.id}.vtt`

  if (playbackPolicy === 'signed' || playbackPolicy === 'drm') {
    const token = generateJwt(client, playbackId, 'v')
    downloadUrl += `?token=${token}`
  }

  const response = await fetch(downloadUrl)
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`)
  }

  const blob = await response.blob()
  const blobUrl = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = blobUrl
  link.download = `${asset.filename || 'captions'}-${track.language_code || 'en'}.vtt`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(blobUrl)
}
