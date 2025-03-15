// ./src/app/page.tsx
import '@/sakura.css'

import {defineQuery} from 'next-sanity'

import {client} from '@/sanity/client'

import {PostsQueryResult} from '../../sanity.types'

const postsQuery = defineQuery(`*[_type == "post" && defined(slug.current)]{
_id,
title,
slug,
}`)

export default async function PostIndex() {
  const posts = await client.fetch<PostsQueryResult>(postsQuery)

  return (
    <main>
      <h1>Posts</h1>
      <ul>
        {posts.map((post) => (
          <li key={post._id}>
            <a href={`/posts/${post.slug.current}`}>{post?.title}</a>
          </li>
        ))}
      </ul>
    </main>
  )
}
