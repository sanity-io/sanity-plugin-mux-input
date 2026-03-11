import {useEffect, useState} from 'react'

import {StagedUpload} from '../components/Uploader'

export function useFetchFileSize(stagedUpload: StagedUpload, maxFileSize?: number) {
  const [fileSize, setFileSize] = useState<number | null>(null)
  const [isLoadingFileSize, setIsLoadingFileSize] = useState(false)
  const [canSkipFileSizeValidation, setCanSkipFileSizeValidation] = useState(false)

  useEffect(() => {
    // Fetch URL Upload file size
    if (stagedUpload.type === 'url') {
      setIsLoadingFileSize(false)
      setCanSkipFileSizeValidation(false)
      setFileSize(null)
      const url = stagedUpload.url

      // Get file size from URL
      const fetchFileSize = async () => {
        setIsLoadingFileSize(true)
        try {
          const response = await fetch(url, {method: 'HEAD'})
          const contentLength = response.headers.get('content-length')
          const newFileSize = contentLength ? parseInt(contentLength, 10) : null

          setIsLoadingFileSize(false)
          if (newFileSize) {
            setFileSize(newFileSize)
          }
          if (newFileSize === null && maxFileSize !== undefined) {
            // Size unknown but size limit is configured - skip file size validation
            setCanSkipFileSizeValidation(true)
          }
        } catch {
          console.warn('Could not validate file size from URL')
          // Skip validation of file size, but still validate duration
          setCanSkipFileSizeValidation(true)
          setIsLoadingFileSize(false)
        }
      }

      fetchFileSize()
    }
    if (stagedUpload.type === 'file') {
      setFileSize(stagedUpload.files[0].size)
    }
  }, [maxFileSize, stagedUpload, stagedUpload.type])

  return {
    fileSize,
    isLoadingFileSize,
    canSkipFileSizeValidation,
  }
}
