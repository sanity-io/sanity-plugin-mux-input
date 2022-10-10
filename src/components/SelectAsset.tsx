import React, {useCallback, useEffect, useRef, useState} from 'react'
import {PatchEvent, set, setIfMissing} from 'sanity'

import {useClient} from '../hooks/useClient'
import type {SetDialogState} from '../hooks/useDialogState'
import type {MuxInputProps, VideoAssetDocument} from '../util/types'
import VideoSource, {type Props as VideoSourceProps} from './VideoSource'

const PER_PAGE = 200

function createQuery(start = 0, end = PER_PAGE) {
  return /* groq */ `*[_type == "mux.videoAsset"] | order(_updatedAt desc) [${start}...${end}]`
}

export interface Props extends Pick<MuxInputProps, 'onChange'> {
  asset?: VideoAssetDocument | null | undefined
  setDialogState: SetDialogState
}

export default function SelectAssets({asset, onChange, setDialogState}: Props) {
  const client = useClient()
  const pageNoRef = useRef(0)
  const [isLastPage, setLastPage] = useState(false)
  const [isLoading, setLoading] = useState(false)
  const [assets, setAssets] = useState<VideoAssetDocument[]>([])

  const fetchPage = useCallback(
    (pageNo: number) => {
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
    },
    [client]
  )
  const handleSelect = useCallback<VideoSourceProps['onSelect']>(
    (id) => {
      const selected = assets.find((doc) => doc._id === id)
      if (!selected) {
        throw new TypeError(`Failed to find video asset with id: ${id}`)
      }
      onChange(
        PatchEvent.from([
          setIfMissing({asset: {}}),
          set({_type: 'reference', _weak: true, _ref: selected._id}, ['asset']),
        ])
      )
      setDialogState(false)
    },
    [assets, onChange, setDialogState]
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
    />
  )
}
