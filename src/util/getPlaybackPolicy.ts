import {getPlaybackId} from './getPlaybackId'
import type {MuxPlaybackId, VideoAssetDocument} from './types'

export function getPlaybackPolicy(
  asset: Pick<VideoAssetDocument, 'data' | 'playbackId'>
): MuxPlaybackId | undefined {
  return (
    asset.data?.playback_ids?.find(
      (playbackId) => getPlaybackId(asset, ['drm', 'signed', 'public']) === playbackId.id
    ) ?? {id: '', policy: 'public'}
  )
}

export function getPlaybackPolicyById(
  asset: Pick<VideoAssetDocument, 'data'>,
  playbackId: string
): MuxPlaybackId | undefined {
  return asset.data?.playback_ids?.find((entry) => playbackId === entry.id)
}
