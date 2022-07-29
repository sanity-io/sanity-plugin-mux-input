import {defineField} from 'sanity'

import {name as muxVideoAssetType} from './mux.videoAsset'

export const name = 'mux.video' as const

const video = defineField({
  name,
  type: 'object',
  title: 'Video asset reference',
  fields: [
    {
      title: 'Video',
      name: 'asset',
      type: 'reference',
      weak: true,
      to: [{type: muxVideoAssetType}],
    },
  ],
})

export default video
