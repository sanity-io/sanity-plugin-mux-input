import {type ObjectInputProps} from 'sanity/form'
import {type ObjectSchemaType, type Reference, type SanityDocument} from 'sanity'

export interface Config {
  mp4_support: 'none' | 'standard'
}

export interface Secrets {
  token: string | null
  secretKey: string | null
  enableSignedUrls: boolean
  signingKeyId: string | null
  signingKeyPrivate: string | null
}

export interface BaseVideo {
  [key: string]: unknown
  asset?: Reference
}

export interface VideoSchemaType extends Omit<ObjectSchemaType, 'options'> {
  options?: {
    // is 'none' by default
    mp4_support?: 'none' | 'standard'
  }
}

export interface VideoInputProps extends ObjectInputProps<BaseVideo, VideoSchemaType> {
  // TODO: map other props
}

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
      policy?: 'signed' | string
    }[]
    // TODO: uncomment the below and check for edge cases
    [key: string]: any
  }
}

export interface AssetType extends SanityDocument {
  _type: 'mux.videoAsset'
  status: string
  assetId: string
  playbackId: string
  filename: string
  thumbTime: string
}
