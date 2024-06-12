// ./src/app/page.tsx
import '@/sakura.css'

import {client} from '@/sanity/client'

type Post = {
  _id: string
  title?: string
  slug: {
    current: string
  }
}

export default async function PostIndex() {
  const posts = await client.fetch<Post[]>(`*[_type == "post" && defined(slug.current)]{
    _id,
    title,
    slug,
  }`)

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
