/* eslint-disable react/react-in-jsx-scope */

import {visionTool} from '@sanity/vision'
import {NextStudio} from 'next-sanity/studio'
import {defineConfig, definePlugin} from 'sanity'
import {deskTool} from 'sanity/desk'

import {muxInput} from '../src'

const shared = definePlugin({
  name: 'shared',
  plugins: [deskTool(), visionTool(), muxInput({mp4_support: 'standard'})],
  schema: {
    types: [
      {
        title: 'Trailer',
        name: 'trailer',
        type: 'document',
        fields: [
          {title: 'Title', name: 'title', type: 'string'},
          {
            title: 'Video',
            name: 'video',
            type: 'mux.video',
          },
        ],
      },
    ],
  },
})

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || ''

const config = defineConfig([
  {
    basePath: '/production',
    dataset: 'production',
    name: 'for-testing',
    projectId,
    plugins: [shared()],
  },
  {
    basePath: '/codesandbox',
    dataset: 'codesandbox',
    name: 'for-demos',
    projectId,
    plugins: [shared()],
  },
])

export default function StudioPage() {
  // Loads the Studio, with all the needed neta tags and global CSS reqiired for it to render correctly
  return <NextStudio config={config} />
}
