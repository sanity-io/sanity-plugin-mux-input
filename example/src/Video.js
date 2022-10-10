import MuxPlayer from '@mux/mux-player-react'
import {suspend} from 'suspend-react'
import createClient from '@sanity/client'
import {useEffect} from 'react'

const client = createClient({
  projectId: 'lb871prh',
  dataset: 'codesandbox',
  useCdn: true,
  withCredentials: false,
  apiVersion: '2022-10-10',
})

export default function Video() {
  const {title, video} = suspend(
    () =>
      client.fetch(/* groq */ `*[_type == "trailer"][0]{
      title,
      "video": video.asset->{assetId,playbackId}
    }`),
    []
  )

  useEffect(() => {
    document.title = title
  }, [title])

  return (
    <MuxPlayer
      playbackId={video.playbackId}
      metadata={{
        video_id: video.assetId,
        video_title: title,
        // viewer_user_id: '...',
      }}
    />
  )
}
