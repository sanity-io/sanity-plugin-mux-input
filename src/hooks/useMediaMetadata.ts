import {useEffect, useState} from 'react'

import {StagedUpload} from '../components/Uploader'

export interface VideoAssetMetadata {
  width?: number
  height?: number
  isAudioOnly?: boolean
  duration?: number
  size?: number
}

export function useMediaMetadata(stagedUpload: StagedUpload) {
  const [videoAssetMetadata, setVideoAssetMetadata] = useState<VideoAssetMetadata | null>(null)
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false)
  useEffect(() => {
    let videoSrc = null
    // Validate file uploads
    if (stagedUpload.type === 'file') {
      const file = stagedUpload.files[0]
      videoSrc = URL.createObjectURL(file)
    }

    // Validate URL uploads
    if (stagedUpload.type === 'url') {
      videoSrc = stagedUpload.url
    }

    setVideoAssetMetadata((old) => ({
      ...old,
      duration: undefined,
      width: undefined,
      height: undefined,
    }))

    if (!videoSrc) return () => null

    setIsLoadingMetadata(true)
    const videoElement = document.createElement('video')
    videoElement.preload = 'metadata'

    const metadataListeners = [
      () => {
        setIsLoadingMetadata(false)
      },
      () => {
        const duration = videoElement.duration
        const width = videoElement.videoWidth
        const height = videoElement.videoHeight
        const isAudioOnly = width <= 0 && height <= 0
        setVideoAssetMetadata((old) => {
          return {
            ...old,
            duration: duration,
            width: width,
            height: height,
            isAudioOnly: isAudioOnly,
          }
        })
      },
    ]

    const cleanupVideo = (videoEl: HTMLVideoElement) => {
      const currentVideoSrc = videoEl?.src
      if (videoEl) {
        metadataListeners.forEach((listener) =>
          videoEl.removeEventListener('loadedmetadata', listener)
        )
        videoEl.onerror = null
        videoEl.src = ''
        videoEl.load()
      }
      if (currentVideoSrc?.startsWith('blob:')) {
        URL.revokeObjectURL(currentVideoSrc)
      }
    }
    metadataListeners.push(() => setTimeout(() => cleanupVideo(videoElement), 0))

    videoElement.onerror = () => {
      setIsLoadingMetadata(false)
      console.warn('Could not read video metadata for validation')
      cleanupVideo(videoElement)
    }

    metadataListeners.forEach((listener) =>
      videoElement.addEventListener('loadedmetadata', listener)
    )
    videoElement.src = videoSrc

    return () => {
      cleanupVideo(videoElement)
    }
  }, [stagedUpload.type, stagedUpload])

  return {
    videoAssetMetadata,
    setVideoAssetMetadata,
    isLoadingMetadata,
  }
}
