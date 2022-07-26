import {type SanityDocument} from '@sanity/types'

export interface Secrets {
  token: string | null
  secretKey: string | null
  enableSignedUrls: boolean
  signingKeyId: string | null
  signingKeyPrivate: string | null
}
// This narrowed type indicates that there may be assets that are signed, and we have the secrets to access them
// enabledSignedUrls might be false but that's only relevant for future uploads and their playback policy
export interface SignableSecrets extends Omit<Secrets, 'signingKeyId' | 'signingKeyPrivate'> {
  signingKeyId: string
  signingKeyPrivate: string
}

export type MuxImageOrigin = `https://image.mux.com`
export type MuxThumbnailUrl = `${MuxImageOrigin}/${string}/thumbnail.png?${string}`
export type MuxApiUrl = string

// 'preserve' by default
// @url: https://docs.mux.com/guides/video/get-images-from-a-video#thumbnail-query-string-parameters
export type FitMode = 'preserve' | 'crop' | 'smartcrop'

export interface ThumbnailOptions {
  fit_mode?: FitMode
  height?: number
  time?: number
  width: number
}

export type PlaybackPolicy = 'signed' | 'public'

export interface VideoAssetDocument extends SanityDocument {
  type: 'mux.videoAsset'
  status: string
  assetId: string
  playbackId: string
  filename: string
  thumbTime: number
  // Docs for what goes in `data` https://docs.mux.com/api-reference/video#tag/assets
  data: {
    aspect_ratio?: '16:9' | string
    errors?: {
      messages?: string[]
    }
    static_renditions?: {
      status?: 'preparing' | 'ready' | string
    }
    playback_ids?: {
      policy?: PlaybackPolicy
    }[]
    // eslint-disable-next-line no-warning-comments
    // TODO: uncomment the below and check for edge cases
    [key: string]: any
  }
}
