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
const query = /* groq */ `*[_type == "trailer"][0]{
  title,
  "playbackId": video.asset->playbackId
}`

export default function Video() {
  const {title, playbackId} = suspend(() => client.fetch(query), [])

  useEffect(() => {
    document.title = title
  }, [title])

  return <MuxPlayer playbackId={playbackId} metadata={{ video_title: title }} />
}
