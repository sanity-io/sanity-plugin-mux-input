// ./src/app/page.tsx
import '@/sakura.css'

import {notFound} from 'next/navigation'

import {client} from '@/sanity/client'

import MuxVideo from './MuxVideo'

type Post = {
  _id: string
  title: string
  slug: {
    current: string
  }
  video?: {
    playbackId?: string
  }
}

export default async function PostPage({params}: {params: {slug: string[]}}) {
  const slug = params.slug.join('/')
  const post = await client.fetch<Post | null>(
    `*[_type == "post" && slug.current == $slug][0]{
    ...,
    "va": video.asset,
    "video": video.asset->{
      playbackId
    }
  }`,
    {
      slug,
    }
  )

  if (!post?._id) {
    return notFound()
  }

  return (
    <main>
      <h1>{post.title}</h1>
      <MuxVideo playbackId={post.video?.playbackId} title={post.title} />
    </main>
  )
}
