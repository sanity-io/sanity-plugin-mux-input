'use client'

import MuxPlayer from '@mux/mux-player-react'

export default function MuxVideo({playbackId, title}: {playbackId?: string; title?: string}) {
  if (!playbackId) return null

  return <MuxPlayer playbackId={playbackId} metadata={title ? {video_title: title} : undefined} />
}
