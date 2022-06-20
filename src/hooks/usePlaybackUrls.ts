/* eslint-disable max-params */
/* eslint-disable no-nested-ternary */
import {useMemo} from 'react'
import {suspend} from 'suspend-react'

import {type VideoAssetDocument} from '../types'
import {generateJwt} from '../util/generateJwt'
import {useSecrets} from './useSecrets'

const origin = 'https://image.mux.com'

// 'preserve' by default
// @url: https://docs.mux.com/guides/video/get-images-from-a-video#thumbnail-query-string-parameters
export type fit_mode = 'preserve' | 'crop' | 'smartcrop' | string

// Mux endpoints for Video assets
// The .png ones also supports .jpg
export type Endpoints = 'thumbnail.png' | 'animated.gif' | 'storyboard.png' | 'storyboard.vtt'

async function createUrl(
  endpoint: Endpoints,
  playbackId: string,
  isSigned: boolean,
  signingKeyId: string | null,
  signingKeyPrivate: string | null,
  params: Map<string, any>
) {
  // console.log('createUrl', endpoint, playbackId, isSigned, params)
  const url = new URL(`/${playbackId}/${endpoint}`, origin)

  if (isSigned && signingKeyId && signingKeyPrivate) {
    // console.log('sign', params)
    const payload = {}
    for (const [key, value] of params) {
      payload[key] = value
    }

    const token = await generateJwt(
      playbackId,
      signingKeyId,
      signingKeyPrivate,
      endpoint === 'animated.gif' ? 'g' : endpoint === 'thumbnail.png' ? 't' : 's',
      payload
    )
    url.searchParams.set('token', token)
  } else {
    // console.log('No sign', params, url, url.searchParams)
    for (const [key, value] of params) {
      // console.log(`url.searchParams.set(${key}, ${value})`)
      url.searchParams.set(key, value)
    }
    // console.log('still no sign?', url.toString())
  }
  const src = url.toString()

  if (
    endpoint === 'thumbnail.png' ||
    endpoint === 'animated.gif' ||
    endpoint === 'storyboard.png'
  ) {
    // Preload the image before handoff
    await new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = resolve
      // image.onerror = reject
      // @TODO: re-implement error handling
      image.onerror = resolve
      image.src = src
      // console.debug(reject)
    })
  }

  return src
}

export interface ThumbnailProps {
  // Starting time code for the video, it uses `asset.thumbTime` as its default
  time?: number
  height?: number
  width?: number
  fit_mode?: fit_mode
}
export function useThumbnailPng(asset: VideoAssetDocument, props?: ThumbnailProps) {
  const {signingKeyId, signingKeyPrivate} = useSecrets()
  const {playbackId, thumbTime} = asset
  const {width, height, fit_mode, time = thumbTime} = props || {}
  const params = useMemo(() => {
    const map = new Map<string, any>()
    if (width) map.set('width', width)
    if (height) map.set('height', height)
    if (time) map.set('time', time)
    if (fit_mode) map.set('fit_mode', fit_mode)
    return map
  }, [fit_mode, height, time, width])

  const isSigned = useIsSigned(asset)

  return suspend(
    () => createUrl('thumbnail.png', playbackId, isSigned, signingKeyId, signingKeyPrivate, params),
    ['thumbnail.png', playbackId, width, time]
  )
}

export interface AnimatedProps {
  // Starting time code for the animation, if no end is set it'll have a 5s duration
  // The start and end timecodes uses `asset.thumbTime` to create an iOS `Live Photo` effect by showing you the 5 secodnds before, and after, the thumb time`
  start?: number
  // End code, can't be longer than 10s after the start code
  end?: number
  // Max 640px, 320px by default
  width?: number
  // Preserves aspect ratio, like width, you can't set both the height and width, max 640
  height?: number
  // The fps is 15 by default, but can go up to 30
  fps?: number
}
export function useAnimatedGif(asset: VideoAssetDocument, props?: AnimatedProps) {
  const {signingKeyId, signingKeyPrivate} = useSecrets()
  const {playbackId, thumbTime = 0} = asset
  const {width, height, fps, start = Math.max(0, thumbTime - 2.5), end = start + 5} = props || {}
  const params = useMemo(() => {
    const map = new Map<string, any>()
    if (width) map.set('width', width)
    if (height) map.set('height', height)
    if (fps) map.set('fps', fps)
    if (start) map.set('start', start)
    if (end) map.set('end', end)
    return map
  }, [end, fps, height, start, width])

  const isSigned = useIsSigned(asset)

  return suspend(
    () => createUrl('animated.gif', playbackId, isSigned, signingKeyId, signingKeyPrivate, params),
    ['animated.gif', playbackId, start]
  )
}

export interface StoryboardProps {
  preload?: boolean
}
export function useStoryboardVtt(asset: VideoAssetDocument, props?: StoryboardProps) {
  const {signingKeyId, signingKeyPrivate} = useSecrets()
  const {playbackId} = asset
  const {preload} = props || {}
  const params = useMemo(() => new Map<string, any>(), [])

  const isSigned = useIsSigned(asset)

  // console.debug('useStoryboardVtt', {preload})

  return suspend(
    () =>
      createUrl('storyboard.vtt', playbackId, isSigned, signingKeyId, signingKeyPrivate, params),
    ['storyboard.vtt', playbackId]
  )
}

export function useVideoSrc(asset: VideoAssetDocument) {
  const {signingKeyId, signingKeyPrivate} = useSecrets()
  const {playbackId} = asset

  const isSigned = useIsSigned(asset)

  return suspend(async () => {
    const url = new URL(`/${playbackId}.m3u8`, 'https://stream.mux.com')
    if (isSigned && signingKeyId && signingKeyPrivate) {
      const token = await generateJwt(playbackId, signingKeyId, signingKeyPrivate, 'v')
      url.searchParams.set('token', token)
    }
    return url.toString()
  }, ['video.m3u8', playbackId, isSigned])
}

export function useIsSigned(asset: VideoAssetDocument): boolean {
  const policy = useMemo(() => asset.data?.playback_ids?.[0]?.policy, [asset.data?.playback_ids])
  return policy === 'signed'
}
