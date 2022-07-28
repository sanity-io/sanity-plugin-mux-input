import {defineField} from 'sanity'

import Preview from '../components/Preview'
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
  //components: {
  //  input: Input,
  //},
  // inputComponent: Input,
  preview: {
    select: {
      playbackId: 'asset.playbackId',
      status: 'asset.status',
      duration: 'asset.data.duration',
      thumbTime: 'asset.thumbTime',
      filename: 'asset.filename',
      playbackIds: 'asset.data.playback_ids',
    },
    component: Preview,
  },
})

export default video
