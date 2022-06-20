import Input from '../components/Input'
import Preview from '../components/Preview'
import {defineType} from 'sanity'

const type: any = defineType({
  name: 'mux.video',
  type: 'object',
  title: 'Video asset reference',
  fields: [
    {
      title: 'Video',
      name: 'asset',
      type: 'reference',
      weak: true,
      to: [{type: 'mux.videoAsset'}],
    },
  ],
  components: {
    input: Input,
  },
  preview: {
    select: {
      playbackId: 'asset.playbackId',
      status: 'asset.status',
      duration: 'asset.data.duration',
      thumbTime: 'asset.thumbTime',
      filename: 'asset.filename',
      playbackIds: 'asset.data.playback_ids',
    },
    // @ts-expect-error -- figure out preview
    component: Preview,
  },
})

export default type
