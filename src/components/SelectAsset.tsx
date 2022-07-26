import React, {useCallback, useEffect, useRef, useState} from 'react'

import client from '../clients/SanityClient'
import type {Secrets, VideoAssetDocument} from '../util/types'
import VideoSource, {type Props as VideoSourceProps} from './VideoSource'

const PER_PAGE = 20

function createQuery(start = 0, end = PER_PAGE) {
  return /* groq */ `*[_type == "mux.videoAsset"] | order(_updatedAt desc) [${start}...${end}] {_id, playbackId, thumbTime, data}`
}

export interface Props {
  onSelect: (asset: VideoAssetDocument) => void
  secrets: Secrets
}

export default function SelectAssets({onSelect, secrets}: Props) {
  const pageNoRef = useRef(0)
  const [isLastPage, setLastPage] = useState(false)
  const [isLoading, setLoading] = useState(false)
  const [assets, setAssets] = useState<VideoAssetDocument[]>([])

  const fetchPage = useCallback((pageNo: number) => {
    const start = pageNo * PER_PAGE
    const end = start + PER_PAGE
    setLoading(true)
    return client
      .fetch(createQuery(start, end))
      .then((result: VideoAssetDocument[]) => {
        setLastPage(result.length < PER_PAGE)
        setAssets((prev) => prev.concat(result))
      })
      .finally(() => setLoading(false))
  }, [])
  const handleSelect = useCallback<VideoSourceProps['onSelect']>(
    (id) => {
      const selected = assets.find((doc) => doc._id === id)
      if (!selected) {
        throw new TypeError(`Failed to find video asset with id: ${id}`)
      }
      onSelect(selected)
    },
    [assets, onSelect]
  )
  const handleLoadMore = useCallback<VideoSourceProps['onLoadMore']>(() => {
    fetchPage(++pageNoRef.current)
  }, [fetchPage])

  useEffect(() => void fetchPage(pageNoRef.current), [fetchPage])

  return (
    <VideoSource
      onSelect={handleSelect}
      assets={assets}
      isLastPage={isLastPage}
      isLoading={isLoading}
      onLoadMore={handleLoadMore}
      secrets={secrets}
    />
  )
}
