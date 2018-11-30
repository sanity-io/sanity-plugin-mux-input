import Input from '../components/Input'
import Preview from '../components/Preview'

export default {
  name: 'mux.video',
  type: 'object',
  title: 'Video asset reference',
  fields: [
    {
      title: 'Video',
      name: 'asset',
      type: 'reference',
      to: [{type: 'mux.videoAsset'}]
    }
  ],
  inputComponent: Input,
  preview: {
    select: {
      playbackId: 'asset.playbackId',
      status: 'asset.status',
      duration: 'asset.data.duration',
      thumbTime: 'asset.thumbTime',
      filename: 'asset.filename'
    },
    component: Preview
  }
}
